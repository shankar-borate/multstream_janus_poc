class ConnectionStatusEngine {
  private status: ConnectionStatusView = {
    owner: "SYSTEM",
    primaryText: "",
    secondaryText: "",
    severity: "info",
    state: "INIT"
  };

  private joinedAt: number | null = null;
  private joinStartedAt: number | null = null;
  private remoteParticipantCount = 0;
  private remoteParticipantSeenAt: number | null = null;
  private remoteTrackSeenAt: number | null = null;
  private remoteMediaFlowAt: number | null = null;
  private checkingSince: number | null = null;
  private localPoorSince: number | null = null;
  private relayDetectedAt: number | null = null;
  private candidateSwitchAt: number | null = null;
  private disconnectedSince: number | null = null;
  private remoteNegotiationReady = false;
  private selectedPairId: string | null = null;
  private remoteVideoTracksByFeed = new Map<number, Set<string>>();
  private localVideoTrackIds = new Set<string>();

  private publisherPc: RTCPeerConnection | null = null;
  private subscriberPcs = new Map<number, RTCPeerConnection>();
  private subscriberBytes = new Map<number, { bytes: number; growthAt: number | null }>();
  private subscriberIceStates = new Map<number, RTCIceConnectionState>();
  private subscriberConnStates = new Map<number, RTCPeerConnectionState>();

  private localIceState: RTCIceConnectionState = "new";
  private localConnState: RTCPeerConnectionState = "new";
  private localSignalingState: RTCSignalingState = "stable";

  private rotationCursor = 0;
  private nextRotationAt = 0;
  private tickTimer: number | null = null;
  private statsBusy = false;
  private lastStatsSampleAt = 0;
  private lastPublishedKey = "";
  private boundPcs = new WeakSet<RTCPeerConnection>();
  private serverRetryAttempt = 0;
  private serverRetryMax = 0;
  private peerRetryAttempt = 0;
  private peerRetryMax = 0;
  private lastStatsErrorLogAt = 0;
  private fatalError: { primary: string; secondary: string } | null = null;

  constructor(private onUpdate?: (status: ConnectionStatusView) => void) {
    this.transition("INIT", true);
    this.tickTimer = window.setInterval(() => this.tick(), APP_CONFIG.connectionStatus.tickIntervalMs);
  }

  getStatus(): ConnectionStatusView {
    return this.status;
  }

  destroy() {
    if (this.tickTimer !== null) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  onJoinStarted() {
    this.joinStartedAt = Date.now();
    this.joinedAt = null;
    this.remoteParticipantCount = 0;
    this.remoteParticipantSeenAt = null;
    this.remoteTrackSeenAt = null;
    this.remoteMediaFlowAt = null;
    this.checkingSince = null;
    this.localPoorSince = null;
    this.relayDetectedAt = null;
    this.candidateSwitchAt = null;
    this.disconnectedSince = null;
    this.remoteNegotiationReady = false;
    this.selectedPairId = null;
    this.subscriberPcs.clear();
    this.subscriberBytes.clear();
    this.subscriberIceStates.clear();
    this.subscriberConnStates.clear();
    this.remoteVideoTracksByFeed.clear();
    this.localVideoTrackIds.clear();
    this.serverRetryAttempt = 0;
    this.serverRetryMax = 0;
    this.peerRetryAttempt = 0;
    this.peerRetryMax = 0;
    this.publisherPc = null;
    this.localIceState = "new";
    this.localConnState = "new";
    this.localSignalingState = "stable";
    this.fatalError = null;
    this.transition("MEDIA_PREP", true);
  }

  onSessionReady() {
    this.transition("NEGOTIATING", true);
  }

  onPublisherAttached() {
    this.transition("NEGOTIATING", true);
  }

  onJoinedRoom() {
    this.joinedAt = Date.now();
    this.transition("NEGOTIATING", true);
  }

  onReconnect() {
    this.transition("RETRYING", true);
  }

  onServerRetrying(attempt: number, maxAttempts: number) {
    this.serverRetryAttempt = Math.max(0, attempt);
    this.serverRetryMax = Math.max(0, maxAttempts);
    this.transition("SERVER_RETRYING", true);
  }

  onPeerRetrying(attempt: number, maxAttempts: number) {
    this.peerRetryAttempt = Math.max(0, attempt);
    this.peerRetryMax = Math.max(0, maxAttempts);
    this.transition("PEER_RETRYING", true);
  }

  onFailed() {
    this.transition("FAILED", true);
  }

  onLeft() {
    this.fatalError = null;
    this.joinStartedAt = null;
    this.joinedAt = null;
    this.remoteParticipantCount = 0;
    this.remoteParticipantSeenAt = null;
    this.remoteTrackSeenAt = null;
    this.remoteMediaFlowAt = null;
    this.checkingSince = null;
    this.localPoorSince = null;
    this.relayDetectedAt = null;
    this.candidateSwitchAt = null;
    this.disconnectedSince = null;
    this.remoteNegotiationReady = false;
    this.selectedPairId = null;
    this.publisherPc = null;
    this.subscriberPcs.clear();
    this.subscriberBytes.clear();
    this.subscriberIceStates.clear();
    this.subscriberConnStates.clear();
    this.remoteVideoTracksByFeed.clear();
    this.localVideoTrackIds.clear();
    this.localIceState = "new";
    this.localConnState = "new";
    this.localSignalingState = "stable";
    this.serverRetryAttempt = 0;
    this.serverRetryMax = 0;
    this.peerRetryAttempt = 0;
    this.peerRetryMax = 0;
    this.transition("INIT", true);
  }

  setFatalError(primary: string, secondary: string = "") {
    this.fatalError = { primary, secondary };
    this.publishFatalError();
  }

  setRemoteParticipantCount(count: number) {
    const now = Date.now();
    this.remoteParticipantCount = Math.max(0, count);
    if (this.remoteParticipantCount > 0 && this.remoteParticipantSeenAt === null) {
      this.remoteParticipantSeenAt = now;
    }
    if (this.remoteParticipantCount === 0) {
      this.remoteParticipantSeenAt = null;
      this.remoteTrackSeenAt = null;
      this.remoteMediaFlowAt = null;
      this.remoteNegotiationReady = false;
      this.subscriberPcs.clear();
      this.subscriberBytes.clear();
      this.subscriberIceStates.clear();
      this.subscriberConnStates.clear();
      this.remoteVideoTracksByFeed.clear();
    }
    this.evaluate();
  }

  registerPublisherPc(pc: RTCPeerConnection) {
    this.publisherPc = pc;
    this.bindPcEvents(pc, "publisher");
    this.evaluate();
  }

  registerSubscriberPc(feedId: number, pc: RTCPeerConnection) {
    this.subscriberPcs.set(feedId, pc);
    this.remoteNegotiationReady = true;
    this.bindPcEvents(pc, "subscriber", feedId);
    this.evaluate();
  }

  onSubscriberRequested() {
    this.remoteNegotiationReady = true;
    this.evaluate();
  }

  unregisterSubscriber(feedId: number) {
    this.subscriberPcs.delete(feedId);
    this.subscriberBytes.delete(feedId);
    this.subscriberIceStates.delete(feedId);
    this.subscriberConnStates.delete(feedId);
    this.remoteVideoTracksByFeed.delete(feedId);
    if (!this.hasLiveRemoteVideoTrack()) {
      this.remoteMediaFlowAt = null;
    }
    this.evaluate();
  }

  onRemoteTrackSignal(feedId: number, track: MediaStreamTrack, on: boolean) {
    if (track.kind !== "video") return;
    let tracks = this.remoteVideoTracksByFeed.get(feedId);
    if (!tracks) {
      tracks = new Set<string>();
      this.remoteVideoTracksByFeed.set(feedId, tracks);
    }

    if (on) {
      const now = Date.now();
      this.remoteTrackSeenAt = now;
      this.remoteNegotiationReady = true;
      tracks.add(track.id);
      if (!this.subscriberBytes.has(feedId)) {
        this.subscriberBytes.set(feedId, { bytes: 0, growthAt: now });
      }
    } else {
      tracks.delete(track.id);
      if (tracks.size === 0) {
        this.remoteVideoTracksByFeed.delete(feedId);
      }
      if (!this.hasLiveRemoteVideoTrack()) {
        this.remoteMediaFlowAt = null;
      }
    }
    this.evaluate();
  }

  onLocalTrackSignal(track: MediaStreamTrack, on: boolean) {
    if (track.kind !== "video") return;
    if (on) {
      this.localVideoTrackIds.add(track.id);
    } else {
      this.localVideoTrackIds.delete(track.id);
    }
    this.evaluate();
  }

  private hasLiveRemoteVideoTrack(): boolean {
    for (const tracks of this.remoteVideoTracksByFeed.values()) {
      if (tracks.size > 0) return true;
    }
    return false;
  }

  onSessionDestroyed() {
    this.transition("RETRYING", true);
  }

  private bindPcEvents(pc: RTCPeerConnection, role: "publisher" | "subscriber", feedId?: number) {
    if (this.boundPcs.has(pc)) return;
    this.boundPcs.add(pc);

    pc.addEventListener("iceconnectionstatechange", () => {
      if (role === "publisher" && this.publisherPc === pc) {
        this.localIceState = pc.iceConnectionState;
        if (pc.iceConnectionState === "checking") {
          if (this.checkingSince === null) this.checkingSince = Date.now();
        } else {
          this.checkingSince = null;
        }
      }
      if (role === "subscriber" && typeof feedId === "number") {
        this.subscriberIceStates.set(feedId, pc.iceConnectionState);
      }
      this.evaluate();
    });

    pc.addEventListener("connectionstatechange", () => {
      if (role === "publisher" && this.publisherPc === pc) {
        this.localConnState = (pc.connectionState || "new") as RTCPeerConnectionState;
      }
      if (role === "subscriber" && typeof feedId === "number") {
        this.subscriberConnStates.set(feedId, (pc.connectionState || "new") as RTCPeerConnectionState);
        this.remoteNegotiationReady = true;
      }
      this.evaluate();
    });

    pc.addEventListener("signalingstatechange", () => {
      if (role === "publisher" && this.publisherPc === pc) {
        this.localSignalingState = pc.signalingState;
      }
      this.evaluate();
    });
  }

  private tick() {
    this.sampleStats();
    this.evaluate();
    this.maybeRotate();
  }

  private async sampleStats() {
    if (this.statsBusy) return;
    const now = Date.now();
    const intervalMs = this.status.state === "CONNECTED"
      ? APP_CONFIG.connectionStatus.statsIntervalConnectedMs
      : APP_CONFIG.connectionStatus.statsIntervalConnectingMs;
    if (now - this.lastStatsSampleAt < intervalMs) return;

    this.statsBusy = true;
    this.lastStatsSampleAt = now;
    try {
      const jobs: Promise<void>[] = [];
      if (this.publisherPc) {
        jobs.push(
          this.publisherPc.getStats()
            .then((report: RTCStatsReport) => this.consumePublisherStats(report))
            .catch((e: any) => this.logStatsError("publisher getStats failed", e))
        );
      }
      for (const [feedId, pc] of this.subscriberPcs.entries()) {
        jobs.push(
          pc.getStats()
            .then((report: RTCStatsReport) => this.consumeSubscriberStats(feedId, report))
            .catch((e: any) => this.logStatsError(`subscriber getStats failed (feedId=${feedId})`, e))
        );
      }
      await Promise.all(jobs);
    } catch (e: any) {
      this.logStatsError("sampleStats failed", e);
    }
    this.statsBusy = false;
  }

  private consumePublisherStats(report: RTCStatsReport) {
    const now = Date.now();
    const byId = new Map<string, RTCStats>();
    report.forEach((s: RTCStats) => byId.set(s.id, s));

    let selectedPairId: string | null = null;
    let rttMs = 0;
    let highLoss = false;
    let relayInUse = false;

    report.forEach((s: RTCStats) => {
      const anyS = s as any;
      if (s.type === "transport" && typeof anyS.selectedCandidatePairId === "string") {
        selectedPairId = anyS.selectedCandidatePairId;
      }
      if (s.type === "candidate-pair") {
        const isSelected = !!anyS.selected || !!anyS.nominated;
        if (!selectedPairId && isSelected) selectedPairId = s.id;
        if (selectedPairId === s.id && typeof anyS.currentRoundTripTime === "number") {
          rttMs = Math.max(rttMs, anyS.currentRoundTripTime * 1000);
        }
      }
      if (s.type === "remote-inbound-rtp" && (anyS.kind === "video" || anyS.mediaType === "video")) {
        const fractionLost = typeof anyS.fractionLost === "number" ? anyS.fractionLost : 0;
        if (fractionLost >= APP_CONFIG.connectionStatus.highPacketLossThreshold) highLoss = true;
      }
      if (s.type === "inbound-rtp" && (anyS.kind === "video" || anyS.mediaType === "video")) {
        const packetsReceived = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
        const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
        const total = packetsReceived + packetsLost;
        if (
          total > APP_CONFIG.connectionStatus.packetLossMinPackets &&
          packetsLost / total >= APP_CONFIG.connectionStatus.highPacketLossThreshold
        ) highLoss = true;
      }
    });

    if (selectedPairId) {
      if (this.selectedPairId && this.selectedPairId !== selectedPairId) {
        this.candidateSwitchAt = now;
      }
      this.selectedPairId = selectedPairId;

      const pair = byId.get(selectedPairId) as any;
      if (pair) {
        const local = byId.get(pair.localCandidateId) as any;
        const remote = byId.get(pair.remoteCandidateId) as any;
        relayInUse = local?.candidateType === "relay" || remote?.candidateType === "relay";
      }
    }

    if (relayInUse) {
      if (this.relayDetectedAt === null) this.relayDetectedAt = now;
    } else {
      this.relayDetectedAt = null;
    }

    const highRtt = rttMs >= APP_CONFIG.connectionStatus.highRttMs;
    if (highRtt || highLoss) {
      if (this.localPoorSince === null) this.localPoorSince = now;
    } else {
      this.localPoorSince = null;
    }
  }

  private consumeSubscriberStats(feedId: number, report: RTCStatsReport) {
    const now = Date.now();
    let bytes = 0;

    report.forEach((s: RTCStats) => {
      const anyS = s as any;
      if (s.type === "inbound-rtp" && (anyS.kind === "video" || anyS.mediaType === "video") && typeof anyS.bytesReceived === "number") {
        bytes += anyS.bytesReceived;
      }
    });

    const prev = this.subscriberBytes.get(feedId) || { bytes: 0, growthAt: null };
    if (bytes > prev.bytes + APP_CONFIG.connectionStatus.bytesGrowthThreshold) {
      prev.growthAt = now;
      this.remoteMediaFlowAt = now;
    }
    prev.bytes = bytes;
    this.subscriberBytes.set(feedId, prev);
  }

  private evaluate() {
    if (this.fatalError) {
      this.publishFatalError();
      return;
    }

    if (this.status.state === "SERVER_RETRYING" || this.status.state === "PEER_RETRYING") {
      return;
    }

    const now = Date.now();
    const hasRemote = this.remoteParticipantCount > 0;
    const localConnected = this.localIceState === "connected" || this.localIceState === "completed";
    const remoteConnected = Array.from(this.subscriberIceStates.values()).some(s => s === "connected" || s === "completed");
    const connectedIce = localConnected || remoteConnected;
    const mediaFlowing = this.remoteMediaFlowAt !== null && now - this.remoteMediaFlowAt <= APP_CONFIG.connectionStatus.mediaFlowRecentMs;
    const liveRemoteVideo = this.hasLiveRemoteVideoTrack();
    const hasLocalVideo = this.localVideoTrackIds.size > 0;

    const anyFailed =
      this.localIceState === "failed" ||
      this.localConnState === "failed" ||
      Array.from(this.subscriberIceStates.values()).some(s => s === "failed") ||
      Array.from(this.subscriberConnStates.values()).some(s => s === "failed");

    if (anyFailed) {
      this.transition("FAILED");
      return;
    }

    const anyDisconnected =
      this.localConnState === "disconnected" ||
      Array.from(this.subscriberConnStates.values()).some(s => s === "disconnected");

    if (anyDisconnected) {
      if (this.disconnectedSince === null) this.disconnectedSince = now;
      this.transition("DEGRADED");
      return;
    }
    this.disconnectedSince = null;

    if (hasRemote && !hasLocalVideo) {
      this.transition("NEGOTIATING");
      return;
    }

    // Connected means both sides are truly exchanging media:
    // local video ready + remote track signaled + inbound media flow.
    // Requiring both remote signals avoids false positives where a track is
    // signaled but no real remote video is visible yet.
    const remoteMediaLive = mediaFlowing && liveRemoteVideo;
    const transportReady = connectedIce || this.remoteNegotiationReady;
    if (hasRemote && hasLocalVideo && remoteMediaLive && transportReady) {
      this.transition("CONNECTED");
      return;
    }

    const relayRecent =
      this.relayDetectedAt !== null &&
      now - this.relayDetectedAt <= APP_CONFIG.connectionStatus.relayRecentMs;
    const candidateSwitchRecent =
      this.candidateSwitchAt !== null &&
      now - this.candidateSwitchAt <= APP_CONFIG.connectionStatus.candidateSwitchRecentMs;

    // LOCAL_SLOW rule set:
    // 1) ICE checking for >12s
    // 2) high RTT or packet loss from RTCPeerConnection stats
    // 3) relay-only path detected early in call setup
    const localSlowByChecking =
      this.checkingSince !== null &&
      now - this.checkingSince > APP_CONFIG.connectionStatus.localSlowCheckingMs;
    const localSlowByStats =
      this.localPoorSince !== null &&
      now - this.localPoorSince > APP_CONFIG.connectionStatus.localSlowStatsMs;
    const localSlowByRelayEarly =
      this.relayDetectedAt !== null &&
      this.joinStartedAt !== null &&
      now - this.joinStartedAt <= APP_CONFIG.connectionStatus.relayEarlyJoinWindowMs &&
      now - this.relayDetectedAt > APP_CONFIG.connectionStatus.relayEarlyThresholdMs &&
      !connectedIce;

    if (localSlowByChecking || localSlowByStats || localSlowByRelayEarly) {
      this.transition("LOCAL_SLOW");
      return;
    }

    // REMOTE_SLOW rule set:
    // remote participant exists and negotiation started, but no remote video track
    // or bytesReceived stays near zero for >10s.
    const remoteWaitAnchor = this.remoteParticipantSeenAt ?? this.joinedAt;
    const remoteWaitingTooLong =
      remoteWaitAnchor !== null &&
      now - remoteWaitAnchor > APP_CONFIG.connectionStatus.remoteSlowWaitMs;
    const remoteFlowStalled = hasRemote && this.remoteNegotiationReady && !liveRemoteVideo && remoteWaitingTooLong;
    if (remoteFlowStalled) {
      this.transition("REMOTE_SLOW");
      return;
    }

    // OPTIMIZING rule set:
    // relay usage or candidate switches indicate active path optimization.
    if (relayRecent || candidateSwitchRecent) {
      this.transition("OPTIMIZING");
      return;
    }

    if (!hasRemote) {
      this.transition(this.joinedAt && hasLocalVideo ? "WAITING_REMOTE" : "NEGOTIATING");
      return;
    }

    if (!connectedIce) {
      this.transition("NETWORK_CHECK");
      return;
    }

    if (this.localSignalingState !== "stable") {
      this.transition("NEGOTIATING");
      return;
    }

    this.transition("NEGOTIATING");
  }

  private maybeRotate() {
    const cfg = CONNECTION_MESSAGES[this.status.state];
    if (!cfg.rotate) return;
    const now = Date.now();
    if (now < this.nextRotationAt) return;
    this.rotationCursor++;
    this.publishCurrent(true);
  }

  private transition(next: ConnectionProductState, forcePublish: boolean = false) {
    if (this.status.state !== next) {
      this.status.state = next;
      this.rotationCursor = 0;
      this.publishCurrent(true);
      return;
    }

    if (forcePublish) {
      this.publishCurrent(true);
    }
  }

  private publishCurrent(force: boolean = false) {
    const cfg = CONNECTION_MESSAGES[this.status.state];
    const p = cfg.primary;
    const s = cfg.secondary;
    const primary = p[this.rotationCursor % p.length] || "";
    const secondary = s[this.rotationCursor % s.length] || "";
    const nextStatus: ConnectionStatusView = {
      owner: cfg.owner,
      severity: cfg.severity,
      primaryText: primary,
      secondaryText: secondary,
      state: this.status.state
    };

    if (nextStatus.state === "SERVER_RETRYING" && this.serverRetryMax > 0) {
      nextStatus.secondaryText = `Retry ${this.serverRetryAttempt}/${this.serverRetryMax}. Reconnecting to video server.`;
    }
    if (nextStatus.state === "PEER_RETRYING" && this.peerRetryMax > 0) {
      nextStatus.secondaryText = `Retry ${this.peerRetryAttempt}/${this.peerRetryMax}. Recovering TURN/peer connection.`;
    }

    if (cfg.rotate) {
      const span = CONNECTION_ROTATION_MAX_MS - CONNECTION_ROTATION_MIN_MS;
      this.nextRotationAt = Date.now() + CONNECTION_ROTATION_MIN_MS + Math.floor(Math.random() * (span + 1));
    } else {
      this.nextRotationAt = Number.MAX_SAFE_INTEGER;
    }

    const key = `${nextStatus.state}|${nextStatus.owner}|${nextStatus.primaryText}|${nextStatus.secondaryText}`;
    if (!force && this.lastPublishedKey === key) return;

    this.status = nextStatus;
    if (this.lastPublishedKey !== key) {
      this.logOwnership(nextStatus);
      this.lastPublishedKey = key;
    }
    this.onUpdate?.(nextStatus);
  }

  private logOwnership(status: ConnectionStatusView) {
    const prefix = status.owner === "LOCAL"
      ? "User"
      : status.owner === "REMOTE"
        ? "Remote"
        : "System";
    const msg = status.secondaryText
      ? `${status.primaryText} ${status.secondaryText}`
      : status.primaryText;
    console.log(`${prefix}: ${msg}`);
  }

  private publishFatalError() {
    if (!this.fatalError) return;
    const nextStatus: ConnectionStatusView = {
      owner: "SYSTEM",
      severity: "error",
      primaryText: this.fatalError.primary,
      secondaryText: this.fatalError.secondary,
      state: "FAILED"
    };
    const key = `${nextStatus.state}|${nextStatus.owner}|${nextStatus.primaryText}|${nextStatus.secondaryText}`;
    this.status = nextStatus;
    if (this.lastPublishedKey !== key) {
      this.logOwnership(nextStatus);
      this.lastPublishedKey = key;
    }
    this.onUpdate?.(nextStatus);
  }

  private logStatsError(message: string, err?: unknown) {
    const now = Date.now();
    if (now - this.lastStatsErrorLogAt < 5000) return;
    this.lastStatsErrorLogAt = now;
    Logger.error(`[connection-status] ${message}`, err);
  }
}
