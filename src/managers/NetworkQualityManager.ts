type NetQuality = "High"|"Medium"|"Low";
type NetworkPeerSnapshot = {
  publisher: RTCPeerConnection | null;
  subscribers: RTCPeerConnection[];
};
type NetworkPeerProvider = () => NetworkPeerSnapshot;
type PeerMetrics = {
  rttMs: number;
  jitterMs: number;
  lossPct: number;
  bitrateKbps: number;
};

class NetworkQualityManager {
  private timer:number|null=null;
  private previousBytes = new Map<string, { bytes: number; at: number }>();
  private sampleBusy = false;

  start(
    cb:(local:NetQuality, remote:NetQuality, details:string)=>void,
    peersProvider?: NetworkPeerProvider
  ){
    this.stop();
    const sample = async () => {
      if (this.sampleBusy) return;
      this.sampleBusy = true;
      try {
        const peers = peersProvider?.() ?? { publisher: null, subscribers: [] };
        const hasPeers = !!peers.publisher || peers.subscribers.length > 0;
        if (hasPeers) {
          const localMetrics = peers.publisher
            ? await this.collectPeerMetrics("publisher", peers.publisher)
            : null;
          const remoteMetricsList = await Promise.all(
            peers.subscribers.map((pc, i) => this.collectPeerMetrics(`subscriber-${i}`, pc))
          );
          const remoteMetrics = this.mergePeerMetrics(remoteMetricsList);

          const local = localMetrics
            ? this.calc(localMetrics.rttMs, localMetrics.jitterMs, localMetrics.lossPct, localMetrics.bitrateKbps)
            : "Low";
          const remote = remoteMetrics
            ? this.calc(remoteMetrics.rttMs, remoteMetrics.jitterMs, remoteMetrics.lossPct, remoteMetrics.bitrateKbps)
            : "Low";

          const details = [
            "src=webrtc-stats",
            localMetrics
              ? `local(rtt=${Math.round(localMetrics.rttMs)}ms jitter=${Math.round(localMetrics.jitterMs)}ms loss=${localMetrics.lossPct.toFixed(1)}% bitrate=${Math.round(localMetrics.bitrateKbps)}kbps)`
              : "local(n/a)",
            remoteMetrics
              ? `remote(rtt=${Math.round(remoteMetrics.rttMs)}ms jitter=${Math.round(remoteMetrics.jitterMs)}ms loss=${remoteMetrics.lossPct.toFixed(1)}% bitrate=${Math.round(remoteMetrics.bitrateKbps)}kbps)`
              : "remote(n/a)"
          ].join(" ");
          cb(local, remote, details);
          return;
        }

        if (APP_CONFIG.networkQuality.useSimulatedFallback) {
          const sim = this.sampleSimulatedMetrics();
          const q = this.calc(sim.rttMs, sim.jitterMs, sim.lossPct, sim.bitrateKbps);
          cb(q, q, `[simulated] rtt=${Math.round(sim.rttMs)}ms jitter=${Math.round(sim.jitterMs)}ms loss=${sim.lossPct.toFixed(1)}% bitrate=${Math.round(sim.bitrateKbps)}kbps`);
          return;
        }

        cb("Low", "Low", "src=webrtc-stats unavailable");
      } catch (e: any) {
        Logger.error("[network-quality] stats sampling failed", e);
        cb("Low", "Low", "src=webrtc-stats error");
      } finally {
        this.sampleBusy = false;
      }
    };

    this.timer = window.setInterval(() => {
      void sample();
    }, APP_CONFIG.networkQuality.sampleIntervalMs);
    void sample();
  }

  stop(){
    if(this.timer!=null){
      clearInterval(this.timer);
      this.timer=null;
    }
    this.sampleBusy = false;
    this.previousBytes.clear();
  }

  private calc(rtt:number,jitter:number,loss:number,bitrate:number):NetQuality{
    let score=0;
    if(rtt<APP_CONFIG.networkQuality.thresholds.rttGoodMs) score++;
    if(jitter<APP_CONFIG.networkQuality.thresholds.jitterGoodMs) score++;
    if(loss<APP_CONFIG.networkQuality.thresholds.lossGoodPct) score++;
    if(bitrate>APP_CONFIG.networkQuality.thresholds.bitrateGoodKbps) score++;
    if(score>=4) return "High";
    if(score>=2) return "Medium";
    return "Low";
  }

  private async collectPeerMetrics(key: string, pc: RTCPeerConnection): Promise<PeerMetrics> {
    const report = await pc.getStats();
    let rttMs = 0;
    let jitterMs = 0;
    let packetsTotal = 0;
    let packetsLost = 0;
    let bytesTotal = 0;

    report.forEach((s: RTCStats) => {
      const anyS = s as any;
      if (s.type === "candidate-pair" && (anyS.selected || anyS.nominated) && typeof anyS.currentRoundTripTime === "number") {
        rttMs = Math.max(rttMs, anyS.currentRoundTripTime * 1000);
      }
      const isMediaRtp = anyS.kind === "video" || anyS.mediaType === "video" || anyS.kind === "audio" || anyS.mediaType === "audio";
      if (s.type === "remote-inbound-rtp" && isMediaRtp && typeof anyS.roundTripTime === "number") {
        rttMs = Math.max(rttMs, anyS.roundTripTime * 1000);
      }
      if ((s.type === "inbound-rtp" || s.type === "outbound-rtp" || s.type === "remote-inbound-rtp") && isMediaRtp) {
        if (typeof anyS.jitter === "number") {
          jitterMs = Math.max(jitterMs, anyS.jitter * 1000);
        }
        const recv = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
        const lost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
        packetsTotal += recv + lost;
        packetsLost += lost;
        const bytesReceived = typeof anyS.bytesReceived === "number" ? anyS.bytesReceived : 0;
        const bytesSent = typeof anyS.bytesSent === "number" ? anyS.bytesSent : 0;
        bytesTotal += bytesReceived + bytesSent;
      }
    });

    const lossPct = packetsTotal > 0 ? (packetsLost / packetsTotal) * 100 : 0;
    const bitrateKbps = this.computeBitrateKbps(key, bytesTotal);
    return { rttMs, jitterMs, lossPct, bitrateKbps };
  }

  private mergePeerMetrics(metrics: PeerMetrics[]): PeerMetrics | null {
    if (metrics.length === 0) return null;
    const totals = metrics.reduce((acc, m) => {
      acc.rttMs += m.rttMs;
      acc.jitterMs += m.jitterMs;
      acc.lossPct += m.lossPct;
      acc.bitrateKbps += m.bitrateKbps;
      return acc;
    }, { rttMs: 0, jitterMs: 0, lossPct: 0, bitrateKbps: 0 });
    const n = metrics.length;
    return {
      rttMs: totals.rttMs / n,
      jitterMs: totals.jitterMs / n,
      lossPct: totals.lossPct / n,
      bitrateKbps: totals.bitrateKbps / n
    };
  }

  private computeBitrateKbps(key: string, bytes: number): number {
    const now = Date.now();
    const prev = this.previousBytes.get(key);
    this.previousBytes.set(key, { bytes, at: now });
    if (!prev || now <= prev.at) return 0;
    const deltaBytes = Math.max(0, bytes - prev.bytes);
    const seconds = (now - prev.at) / 1000;
    if (seconds <= 0) return 0;
    return (deltaBytes * 8) / 1000 / seconds;
  }

  private sampleSimulatedMetrics(): PeerMetrics {
    return {
      rttMs: APP_CONFIG.networkQuality.simulated.rttBaseMs + Math.random() * APP_CONFIG.networkQuality.simulated.rttSpreadMs,
      jitterMs: APP_CONFIG.networkQuality.simulated.jitterBaseMs + Math.random() * APP_CONFIG.networkQuality.simulated.jitterSpreadMs,
      lossPct: Math.random() * APP_CONFIG.networkQuality.simulated.lossMaxPct,
      bitrateKbps: APP_CONFIG.networkQuality.simulated.bitrateBaseKbps + Math.random() * APP_CONFIG.networkQuality.simulated.bitrateSpreadKbps
    };
  }
}
