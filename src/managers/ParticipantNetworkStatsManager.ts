type ParticipantPeerRates = {
  sentKbps: number | null;
  receivedKbps: number | null;
  rttMs: number | null;
  jitterMs: number | null;
  lossPct: number | null;
};

class ParticipantNetworkStatsManager {
  private timer: number | null = null;
  private sampleBusy = false;
  private previousCounters = new Map<string, { sentBytes: number; receivedBytes: number; at: number }>();
  private slowLinks = new Map<string, { uplinkAt: number; downlinkAt: number }>();
  private remoteTelemetryByFeed = new Map<number, PeerNetworkTelemetry>();

  start(
    cb: (snapshot: ParticipantNetworkSnapshot) => void,
    peersProvider: () => ParticipantNetworkPeers
  ) {
    this.stop();
    const sample = async () => {
      if (this.sampleBusy) return;
      this.sampleBusy = true;
      try {
        const snapshot = await this.buildSnapshot(peersProvider());
        cb(snapshot);
      } catch (e: any) {
        Logger.error("participant network sampling failed", e);
      } finally {
        this.sampleBusy = false;
      }
    };

    this.timer = window.setInterval(() => {
      void sample();
    }, APP_CONFIG.networkQuality.participantPanel.sampleIntervalMs);
    void sample();
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.sampleBusy = false;
    this.previousCounters.clear();
    this.slowLinks.clear();
    this.remoteTelemetryByFeed.clear();
  }

  recordSlowLink(signal: JanusSlowLinkSignal) {
    const key = signal.source === "publisher"
      ? "self"
      : `feed:${signal.feedId ?? signal.participantId ?? -1}`;
    const prev = this.slowLinks.get(key) ?? { uplinkAt: 0, downlinkAt: 0 };
    if (signal.direction === "uplink") {
      prev.uplinkAt = signal.at || Date.now();
    } else {
      prev.downlinkAt = signal.at || Date.now();
    }
    this.slowLinks.set(key, prev);
  }

  recordRemoteNetworkTelemetry(feedId: number, payload: PeerNetworkTelemetry) {
    if (!Number.isFinite(feedId)) return;
    this.remoteTelemetryByFeed.set(feedId, payload);
  }

  private async buildSnapshot(peers: ParticipantNetworkPeers): Promise<ParticipantNetworkSnapshot> {
    const remoteCount = peers.subscribers.length;

    const localRates = peers.publisher
      ? await this.collectPeerRates("publisher", peers.publisher)
      : { sentKbps: null, receivedKbps: null, rttMs: null, jitterMs: null, lossPct: null };

    const remoteRates = await Promise.all(peers.subscribers.map(async (sub) => {
      const rates = await this.collectPeerRates(`subscriber-${sub.feedId}`, sub.pc);
      const remoteTelemetry = this.getFreshRemoteTelemetry(sub.feedId);
      return { feedId: sub.feedId, rates, remoteTelemetry };
    }));

    const remoteUploadsKnown = remoteRates
      .map((entry) => entry.remoteTelemetry?.uploadKbps ?? entry.rates.receivedKbps)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const remoteDownloadsKnown = remoteRates
      .map((entry) => entry.remoteTelemetry?.downloadKbps ?? null)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const remoteJitterKnown = remoteRates
      .map((entry) => entry.remoteTelemetry?.jitterMs ?? entry.rates.jitterMs)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const remoteLossKnown = remoteRates
      .map((entry) => entry.remoteTelemetry?.lossPct ?? entry.rates.lossPct)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const remoteRttKnown = remoteRates
      .map((entry) => entry.rates.rttMs)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const localDownloadKbps = remoteCount === 0
      ? 0
      : (
        remoteUploadsKnown.length > 0
          ? remoteUploadsKnown.reduce((sum, v) => sum + v, 0)
          : null
      );
    const aggregateRemoteJitterMs = remoteCount === 0 ? null : this.averageKnown(remoteJitterKnown);
    const aggregateRemoteLossPct = remoteCount === 0 ? null : this.averageKnown(remoteLossKnown);
    const aggregateRemoteRttMs = remoteCount === 0 ? null : this.averageKnown(remoteRttKnown);

    const localUploadKbps = localRates.sentKbps;
    const remoteDownloadSumKbps = remoteCount === 0
      ? 0
      : (
        remoteDownloadsKnown.length > 0
          ? remoteDownloadsKnown.reduce((sum, v) => sum + v, 0)
          : localUploadKbps
      );
    const perRemoteDownloadKbps =
      remoteCount > 0 && localUploadKbps !== null
        ? localUploadKbps / remoteCount
        : null;
    const localUploadDirection = this.createDirection(localUploadKbps, this.isSlowLinkActive("self", "uplink"));
    const localDownloadDirection = this.createDirection(localDownloadKbps, this.isSlowLinkActive("self", "downlink"));
    const aggregateRemoteUploadDirection = this.createDirection(
      remoteCount === 0 ? 0 : localDownloadKbps,
      remoteCount > 0 && remoteRates.some((entry) => this.isSlowLinkActive(`feed:${entry.feedId}`, "uplink"))
    );
    const aggregateRemoteDownloadDirection = this.createDirection(
      remoteCount === 0 ? 0 : remoteDownloadSumKbps,
      remoteCount > 0 && remoteRates.some((entry) => this.isSlowLinkActive(`feed:${entry.feedId}`, "downlink"))
    );

    const rows: ParticipantNetworkRow[] = [];
    const selfLabel = peers.selfId !== null ? `You (${peers.selfId})` : "You";
    rows.push({
      participantId: peers.selfId,
      label: selfLabel,
      upload: localUploadDirection,
      download: localDownloadDirection,
      remoteUpload: aggregateRemoteUploadDirection,
      remoteDownload: aggregateRemoteDownloadDirection,
      quality: {
        localRttMs: localRates.rttMs,
        localJitterMs: localRates.jitterMs,
        localLossPct: localRates.lossPct,
        remoteRttMs: aggregateRemoteRttMs,
        remoteJitterMs: aggregateRemoteJitterMs,
        remoteLossPct: aggregateRemoteLossPct
      },
      likelyBottleneck: this.classifyBottleneck(
        localUploadDirection,
        localDownloadDirection,
        aggregateRemoteUploadDirection,
        aggregateRemoteDownloadDirection
      )
    });

    remoteRates.forEach(({ feedId, rates, remoteTelemetry }) => {
      const key = `feed:${feedId}`;
      const remoteUploadDirection = this.createDirection(
        remoteTelemetry?.uploadKbps ?? rates.receivedKbps,
        this.isSlowLinkActive(key, "uplink")
      );
      const remoteDownloadDirection = this.createDirection(
        remoteTelemetry?.downloadKbps ?? perRemoteDownloadKbps,
        this.isSlowLinkActive(key, "downlink")
      );
      rows.push({
        participantId: feedId,
        label: `Participant ${feedId}`,
        upload: remoteUploadDirection,
        download: remoteDownloadDirection,
        remoteUpload: localUploadDirection,
        remoteDownload: localDownloadDirection,
        quality: {
          localRttMs: localRates.rttMs,
          localJitterMs: localRates.jitterMs,
          localLossPct: localRates.lossPct,
          remoteRttMs: rates.rttMs,
          remoteJitterMs: remoteTelemetry?.jitterMs ?? rates.jitterMs,
          remoteLossPct: remoteTelemetry?.lossPct ?? rates.lossPct
        },
        likelyBottleneck: this.classifyBottleneck(
          localUploadDirection,
          localDownloadDirection,
          remoteUploadDirection,
          remoteDownloadDirection
        )
      });
    });

    return {
      rows,
      updatedAt: Date.now()
    };
  }

  private createDirection(
    kbps: number | null,
    forceLowBySlowLink: boolean
  ): ParticipantNetworkDirectionSnapshot {
    const normalized = kbps !== null && Number.isFinite(kbps) ? Math.max(0, kbps) : null;
    return {
      kbps: normalized,
      tier: this.classifyTier(normalized),
      slowLink: forceLowBySlowLink
    };
  }

  private classifyTier(kbps: number | null): ParticipantNetworkTier {
    if (kbps === null || !Number.isFinite(kbps)) return "Pending";
    const lowMax = APP_CONFIG.networkQuality.participantPanel.thresholdsKbps.lowMax;
    const mediumMax = APP_CONFIG.networkQuality.participantPanel.thresholdsKbps.mediumMax;
    if (kbps <= lowMax) return "Low";
    if (kbps <= mediumMax) return "Medium";
    return "Good";
  }

  private getFreshRemoteTelemetry(feedId: number): PeerNetworkTelemetry | null {
    const payload = this.remoteTelemetryByFeed.get(feedId) ?? null;
    if (!payload) return null;
    if (Date.now() - payload.ts > APP_CONFIG.mediaTelemetry.peerTelemetryFreshnessMs) return null;
    return payload;
  }

  private classifyBottleneck(
    localUpload: ParticipantNetworkDirectionSnapshot,
    localDownload: ParticipantNetworkDirectionSnapshot,
    remoteUpload: ParticipantNetworkDirectionSnapshot,
    remoteDownload: ParticipantNetworkDirectionSnapshot
  ): "You" | "Remote" | "Both" | "Unknown" {
    const localSlow = localUpload.slowLink || localDownload.slowLink;
    const remoteSlow = remoteUpload.slowLink || remoteDownload.slowLink;
    if (localSlow && remoteSlow) return "Both";
    if (localSlow) return "You";
    if (remoteSlow) return "Remote";

    const localUplinkBad = localUpload.tier === "Low";
    const localDownlinkBad = localDownload.tier === "Low";
    const remoteUplinkBad = remoteUpload.tier === "Low";
    const remoteDownlinkBad = remoteDownload.tier === "Low";

    const uploadPathBad = localUplinkBad && remoteDownlinkBad;
    const downloadPathBad = remoteUplinkBad && localDownlinkBad;
    if (uploadPathBad && downloadPathBad) return "Both";
    if (uploadPathBad) return "You";
    if (downloadPathBad) return "Remote";

    if ((localUplinkBad || localDownlinkBad) && !(remoteUplinkBad || remoteDownlinkBad)) return "You";
    if ((remoteUplinkBad || remoteDownlinkBad) && !(localUplinkBad || localDownlinkBad)) return "Remote";
    return "Unknown";
  }

  private averageKnown(values: number[]): number | null {
    if (!values || values.length === 0) return null;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
  }

  private isSlowLinkActive(key: string, direction: "uplink" | "downlink"): boolean {
    const entry = this.slowLinks.get(key);
    if (!entry) return false;
    const at = direction === "uplink" ? entry.uplinkAt : entry.downlinkAt;
    if (!at) return false;
    return Date.now() - at <= APP_CONFIG.networkQuality.participantPanel.slowLinkHoldMs;
  }

  private async collectPeerRates(key: string, pc: RTCPeerConnection): Promise<ParticipantPeerRates> {
    const report = await pc.getStats();
    let sentBytes = 0;
    let receivedBytes = 0;
    let rttMs: number | null = null;
    let jitterMs: number | null = null;
    let lost = 0;
    let total = 0;

    report.forEach((s: RTCStats) => {
      const anyS = s as any;
      const kind = anyS.kind || anyS.mediaType;
      if (s.type === "candidate-pair" && (anyS.selected || anyS.nominated) && typeof anyS.currentRoundTripTime === "number") {
        const nextRtt = anyS.currentRoundTripTime * 1000;
        rttMs = rttMs === null ? nextRtt : Math.max(rttMs, nextRtt);
      }
      if (s.type === "remote-inbound-rtp" && typeof anyS.roundTripTime === "number") {
        const nextRtt = anyS.roundTripTime * 1000;
        rttMs = rttMs === null ? nextRtt : Math.max(rttMs, nextRtt);
      }

      if (kind !== "audio" && kind !== "video") return;

      if (s.type === "outbound-rtp" || s.type === "inbound-rtp") {
        if (typeof anyS.bytesSent === "number") sentBytes += anyS.bytesSent;
        if (typeof anyS.bytesReceived === "number") receivedBytes += anyS.bytesReceived;
      }

      if (s.type === "inbound-rtp" || s.type === "remote-inbound-rtp") {
        if (typeof anyS.jitter === "number") {
          const nextJitterMs = anyS.jitter * 1000;
          jitterMs = jitterMs === null ? nextJitterMs : Math.max(jitterMs, nextJitterMs);
        }
        const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
        const packetsReceivedOrSent = typeof anyS.packetsReceived === "number"
          ? anyS.packetsReceived
          : (typeof anyS.packetsSent === "number" ? anyS.packetsSent : 0);
        if (packetsLost > 0 || packetsReceivedOrSent > 0) {
          lost += packetsLost;
          total += packetsLost + packetsReceivedOrSent;
        }
      }
    });

    return this.computeRatesKbps(
      key,
      sentBytes,
      receivedBytes,
      rttMs,
      jitterMs,
      total > 0 ? (lost / total) * 100 : null
    );
  }

  private computeRatesKbps(
    key: string,
    sentBytes: number,
    receivedBytes: number,
    rttMs: number | null,
    jitterMs: number | null,
    lossPct: number | null
  ): ParticipantPeerRates {
    const now = Date.now();
    const prev = this.previousCounters.get(key);
    this.previousCounters.set(key, { sentBytes, receivedBytes, at: now });

    if (!prev || now <= prev.at) {
      return {
        sentKbps: null,
        receivedKbps: null,
        rttMs,
        jitterMs,
        lossPct
      };
    }

    const seconds = (now - prev.at) / 1000;
    if (seconds <= 0) {
      return {
        sentKbps: null,
        receivedKbps: null,
        rttMs,
        jitterMs,
        lossPct
      };
    }

    const sentDelta = Math.max(0, sentBytes - prev.sentBytes);
    const receivedDelta = Math.max(0, receivedBytes - prev.receivedBytes);
    return {
      sentKbps: (sentDelta * 8) / 1000 / seconds,
      receivedKbps: (receivedDelta * 8) / 1000 / seconds,
      rttMs,
      jitterMs,
      lossPct
    };
  }
}
