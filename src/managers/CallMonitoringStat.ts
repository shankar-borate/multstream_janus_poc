type CallMonitoringStatCallbacks = {
  getJoinedRoom: () => boolean;
  getPublisherPc: () => RTCPeerConnection | null;
  getSubscriberPcs: () => RTCPeerConnection[];
  getRemoteParticipantCount: () => number;
  getPreferredAudioTrack: () => MediaStreamTrack | null;
  getPreferredVideoTrack: () => MediaStreamTrack | null;
  isLocalAudioMuted: () => boolean;
  isLocalVideoMuted: () => boolean;
  isRemoteHoldActive: () => boolean;
  getPeerTelemetry: (now: number) => PeerPlaybackTelemetry | null;
  emitPeerTelemetry: (payload: PeerPlaybackTelemetry) => void;
  emitPeerNetworkTelemetry: (payload: PeerNetworkTelemetry) => void;
};

class CallMonitoringStat {
  private mediaStatsTimer: number | null = null;
  private metricsPrevAt = 0;
  private mediaStatsStartedAt = 0;
  private outboundPrev = { audio: 0, video: 0 };
  private outboundAudioPacketsPrev = 0;
  private inboundPrev = { audio: 0, video: 0 };
  private inboundPacketsPrev = { audio: 0, video: 0 };
  private inboundVideoFramesDecodedPrev = 0;
  private remoteInboundPrev = { audioPackets: 0, videoPackets: 0 };
  private remoteReceiveGrowthAt = { audio: 0, video: 0 };
  private localReceiveGrowthAt = { audio: 0, video: 0 };
  private remoteVideoPlaybackAt = 0;
  private lastRemoteVideoTime = 0;
  private localAudioPlaybackAt = 0;
  private lastPeerNetworkTelemetryAt = 0;
  private activeOutages = new Map<MediaOutageKey, MediaOutageRecord>();
  private recentOutages: MediaOutageRecord[] = [];
  private readonly maxRecentOutages = 12;
  private readonly outageDefinitions: Record<MediaOutageKey, {
    label: string;
    kind: MediaOutageKind;
    scope: MediaOutageScope;
    mode: MediaOutageMode;
  }> = {
    "local-receive-audio": {
      label: "Participant audio not received locally",
      kind: "audio",
      scope: "local",
      mode: "receive"
    },
    "local-receive-video": {
      label: "Participant video not received locally",
      kind: "video",
      scope: "local",
      mode: "receive"
    },
    "local-playback-audio": {
      label: "Participant audio playback stalled locally",
      kind: "audio",
      scope: "local",
      mode: "playback"
    },
    "local-playback-video": {
      label: "Participant video playback stalled locally",
      kind: "video",
      scope: "local",
      mode: "playback"
    },
    "remote-receive-audio": {
      label: "Your audio not received by participant",
      kind: "audio",
      scope: "remote",
      mode: "receive"
    },
    "remote-receive-video": {
      label: "Your video not received by participant",
      kind: "video",
      scope: "remote",
      mode: "receive"
    },
    "remote-playback-audio": {
      label: "Your audio playback stalled for participant",
      kind: "audio",
      scope: "remote",
      mode: "playback"
    },
    "remote-playback-video": {
      label: "Your video playback stalled for participant",
      kind: "video",
      scope: "remote",
      mode: "playback"
    }
  };

  constructor(
    private bus: EventBus,
    private remoteVideo: HTMLVideoElement,
    private callbacks: CallMonitoringStatCallbacks
  ) {}

  start() {
    this.stop();
    this.mediaStatsStartedAt = Date.now();
    this.metricsPrevAt = 0;
    this.outboundPrev = { audio: 0, video: 0 };
    this.outboundAudioPacketsPrev = 0;
    this.inboundPrev = { audio: 0, video: 0 };
    this.inboundPacketsPrev = { audio: 0, video: 0 };
    this.inboundVideoFramesDecodedPrev = 0;
    this.remoteInboundPrev = { audioPackets: 0, videoPackets: 0 };
    this.remoteReceiveGrowthAt = { audio: 0, video: 0 };
    this.localReceiveGrowthAt = { audio: 0, video: 0 };
    this.remoteVideoPlaybackAt = 0;
    this.lastRemoteVideoTime = 0;
    this.localAudioPlaybackAt = 0;
    this.lastPeerNetworkTelemetryAt = 0;
    this.activeOutages.clear();
    this.recentOutages = [];

    this.mediaStatsTimer = window.setInterval(() => {
      void this.sample();
    }, APP_CONFIG.mediaTelemetry.sampleIntervalMs);
    void this.sample();
  }

  stop() {
    if (this.mediaStatsTimer !== null) {
      window.clearInterval(this.mediaStatsTimer);
      this.mediaStatsTimer = null;
    }
    const now = Date.now();
    this.mediaStatsStartedAt = 0;
    this.lastPeerNetworkTelemetryAt = 0;
    this.resolveAllActiveOutages(now);
    this.bus.emit("media-io", {
      bytes: { audioSent: 0, audioReceived: 0, videoSent: 0, videoReceived: 0 },
      quality: { localJitterMs: null, localLossPct: null, remoteJitterMs: null, remoteLossPct: null },
      issues: [],
      matrix: {
        remoteReceivingYourVideo: "Not possible",
        remoteReceivingYourAudio: "Not possible",
        remoteAudioPlaybackStatus: "Not possible",
        remoteVideoPlaybackStatus: "Not possible",
        localReceivingYourVideo: "Not possible",
        localReceivingYourAudio: "Not possible",
        localAudioPlaybackStatus: "Not possible",
        localVideoPlaybackStatus: "Not possible"
      },
      outages: this.buildOutageSnapshot(now),
      ts: now
    } as MediaIoSnapshot);
  }

  private async sample() {
    const now = Date.now();
    const publisher = this.callbacks.getPublisherPc();
    const subscribers = this.callbacks.getSubscriberPcs();
    const remoteCount = this.callbacks.getRemoteParticipantCount();
    const remoteMs = this.remoteVideo.srcObject as MediaStream | null;
    const hasLiveRemoteTrack = !!remoteMs?.getTracks().some((t: MediaStreamTrack) => t.readyState === "live");
    const remotePresent = remoteCount > 0 || subscribers.length > 0 || hasLiveRemoteTrack;
    const elapsedMs = this.mediaStatsStartedAt > 0 ? now - this.mediaStatsStartedAt : 0;
    const inWarmup = elapsedMs <= APP_CONFIG.mediaTelemetry.stallWindowMs;
    if (!publisher && subscribers.length === 0) {
      this.resolveAllActiveOutages(now);
      const joined = this.callbacks.getJoinedRoom();
      const pendingOrNotPossible: YesNoUnknown = (joined && inWarmup) ? "Pending" : "Not possible";
      const playbackPendingOrNotPossible: PlaybackState = (joined && inWarmup) ? "Pending" : "Not possible";
      const localReceiveState: YesNoUnknown = remotePresent ? (inWarmup ? "Pending" : "Not possible") : "Not possible";
      const localPlaybackState: PlaybackState = remotePresent ? (inWarmup ? "Pending" : "Not possible") : "Not possible";
      this.bus.emit("media-io", {
        bytes: { audioSent: 0, audioReceived: 0, videoSent: 0, videoReceived: 0 },
        quality: { localJitterMs: null, localLossPct: null, remoteJitterMs: null, remoteLossPct: null },
        issues: [],
        matrix: {
          remoteReceivingYourVideo: pendingOrNotPossible,
          remoteReceivingYourAudio: pendingOrNotPossible,
          remoteAudioPlaybackStatus: playbackPendingOrNotPossible,
          remoteVideoPlaybackStatus: playbackPendingOrNotPossible,
          localReceivingYourVideo: localReceiveState,
          localReceivingYourAudio: localReceiveState,
          localAudioPlaybackStatus: localPlaybackState,
          localVideoPlaybackStatus: localPlaybackState
        },
        outages: this.buildOutageSnapshot(now),
        ts: now
      } as MediaIoSnapshot);
      return;
    }

    const publisherMetrics = publisher ? await this.collectPublisherMetrics(publisher) : {
      audioBytesSent: 0,
      audioPacketsSent: 0,
      videoBytesSent: 0,
      remoteInboundAudioPacketsReceived: null as number | null,
      remoteInboundVideoPacketsReceived: null as number | null,
      localJitterMs: null as number | null,
      localLossPct: null as number | null
    };
    const subscriberMetrics = await this.collectSubscriberMetrics(subscribers);

    const prevAt = this.metricsPrevAt;
    this.metricsPrevAt = now;
    const audioSentDelta = Math.max(0, publisherMetrics.audioBytesSent - this.outboundPrev.audio);
    const audioPacketsSentDelta = Math.max(0, publisherMetrics.audioPacketsSent - this.outboundAudioPacketsPrev);
    const videoSentDelta = Math.max(0, publisherMetrics.videoBytesSent - this.outboundPrev.video);
    const audioRecvDelta = Math.max(0, subscriberMetrics.audioBytesReceived - this.inboundPrev.audio);
    const videoRecvDelta = Math.max(0, subscriberMetrics.videoBytesReceived - this.inboundPrev.video);
    const audioPacketsRecvDelta = Math.max(0, subscriberMetrics.audioPacketsReceived - this.inboundPacketsPrev.audio);
    const videoPacketsRecvDelta = Math.max(0, subscriberMetrics.videoPacketsReceived - this.inboundPacketsPrev.video);
    const videoFramesDecodedDelta = Math.max(0, subscriberMetrics.videoFramesDecoded - this.inboundVideoFramesDecodedPrev);
    const audioMeaningfulProgress = this.isMeaningfulAudioReceiveProgress(audioRecvDelta, audioPacketsRecvDelta);
    const videoMeaningfulProgress = this.isMeaningfulVideoReceiveProgress(
      videoRecvDelta,
      videoPacketsRecvDelta,
      videoFramesDecodedDelta
    );
    this.outboundPrev = { audio: publisherMetrics.audioBytesSent, video: publisherMetrics.videoBytesSent };
    this.outboundAudioPacketsPrev = publisherMetrics.audioPacketsSent;
    this.inboundPrev = { audio: subscriberMetrics.audioBytesReceived, video: subscriberMetrics.videoBytesReceived };
    this.inboundPacketsPrev = {
      audio: subscriberMetrics.audioPacketsReceived,
      video: subscriberMetrics.videoPacketsReceived
    };
    this.inboundVideoFramesDecodedPrev = subscriberMetrics.videoFramesDecoded;

    const localOutgoingAudioTrack = this.callbacks.getPreferredAudioTrack();
    const localOutgoingAudioActive = !!localOutgoingAudioTrack &&
      localOutgoingAudioTrack.readyState === "live" &&
      localOutgoingAudioTrack.enabled !== false &&
      !this.callbacks.isLocalAudioMuted();
    const localOutgoingVideoTrack = this.callbacks.getPreferredVideoTrack();
    const localOutgoingVideoActive = !!localOutgoingVideoTrack &&
      localOutgoingVideoTrack.readyState === "live" &&
      localOutgoingVideoTrack.enabled !== false &&
      !this.callbacks.isLocalVideoMuted();
    const remoteHoldActive = this.callbacks.isRemoteHoldActive();

    let remoteAudioReceiveStatus: YesNoUnknown = remotePresent ? "Pending" : "Not possible";
    let remoteVideoReceiveStatus: YesNoUnknown = remotePresent ? "Pending" : "Not possible";
    if (remotePresent) {
      if (publisherMetrics.remoteInboundAudioPacketsReceived === null) {
        if (publisher && (audioSentDelta > 0 || audioPacketsSentDelta > 0)) this.remoteReceiveGrowthAt.audio = now;
        if (!publisher) {
          remoteAudioReceiveStatus = "Pending";
        } else if (this.remoteReceiveGrowthAt.audio > 0 && now - this.remoteReceiveGrowthAt.audio <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
          remoteAudioReceiveStatus = "Yes";
        } else if (inWarmup) {
          remoteAudioReceiveStatus = "Pending";
        } else {
          remoteAudioReceiveStatus = "Not possible";
        }
      } else {
        const delta = publisherMetrics.remoteInboundAudioPacketsReceived - this.remoteInboundPrev.audioPackets;
        if (delta > 0) this.remoteReceiveGrowthAt.audio = now;
        remoteAudioReceiveStatus =
          this.remoteReceiveGrowthAt.audio > 0 && now - this.remoteReceiveGrowthAt.audio <= APP_CONFIG.mediaTelemetry.stallWindowMs
            ? "Yes"
            : "No";
      }
      if (publisherMetrics.remoteInboundVideoPacketsReceived === null) {
        if (publisher && videoSentDelta > 0) this.remoteReceiveGrowthAt.video = now;
        if (!publisher) {
          remoteVideoReceiveStatus = "Pending";
        } else if (this.remoteReceiveGrowthAt.video > 0 && now - this.remoteReceiveGrowthAt.video <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
          remoteVideoReceiveStatus = "Yes";
        } else if (inWarmup) {
          remoteVideoReceiveStatus = "Pending";
        } else {
          remoteVideoReceiveStatus = "Not possible";
        }
      } else {
        const delta = publisherMetrics.remoteInboundVideoPacketsReceived - this.remoteInboundPrev.videoPackets;
        if (delta > 0) this.remoteReceiveGrowthAt.video = now;
        remoteVideoReceiveStatus =
          this.remoteReceiveGrowthAt.video > 0 && now - this.remoteReceiveGrowthAt.video <= APP_CONFIG.mediaTelemetry.stallWindowMs
            ? "Yes"
            : "No";
      }
    } else {
      this.remoteReceiveGrowthAt.audio = 0;
      this.remoteReceiveGrowthAt.video = 0;
    }
    this.remoteInboundPrev = {
      audioPackets: publisherMetrics.remoteInboundAudioPacketsReceived ?? this.remoteInboundPrev.audioPackets,
      videoPackets: publisherMetrics.remoteInboundVideoPacketsReceived ?? this.remoteInboundPrev.videoPackets
    };

    if (videoMeaningfulProgress) {
      this.localReceiveGrowthAt.video = now;
    }
    if (audioMeaningfulProgress) {
      this.localReceiveGrowthAt.audio = now;
    }
    const localReceivingVideo: YesNoUnknown = this.deriveLocalReceiveStatus(remotePresent, this.localReceiveGrowthAt.video, now, inWarmup);
    const localReceivingAudio: YesNoUnknown = this.deriveLocalReceiveStatus(remotePresent, this.localReceiveGrowthAt.audio, now, inWarmup);
    const localVideoPlaybackStatus = this.deriveLocalVideoPlaybackStatus(
      now,
      remotePresent,
      inWarmup,
      videoMeaningfulProgress,
      subscriberMetrics.hasVideoTrack
    );
    const localAudioPlaybackStatus = this.deriveLocalAudioPlaybackStatus(
      now,
      audioMeaningfulProgress,
      subscriberMetrics.hasAudioTrack,
      remotePresent,
      inWarmup
    );
    const peerTelemetry = this.callbacks.getPeerTelemetry(now);
    const remoteAudioPlaybackStatus = peerTelemetry?.audioPlaybackStatus ?? (remotePresent ? "Pending" : "Not possible");
    const remoteVideoPlaybackStatus = peerTelemetry?.videoPlaybackStatus ?? (remotePresent ? "Pending" : "Not possible");

    const issues: string[] = [];
    if (remoteAudioReceiveStatus === "No" && remotePresent && localOutgoingAudioActive) {
      issues.push("your audio not working");
    }
    if (localReceivingAudio === "No" && remotePresent && !remoteHoldActive) {
      issues.push("participant audio not working");
    }
    if (localReceivingVideo === "No" && remotePresent && !remoteHoldActive) {
      issues.push("participant video not working");
    }

    const outages = this.updateOutageTracking({
      now,
      remotePresent,
      remoteHoldActive,
      localOutgoingAudioActive,
      localOutgoingVideoActive,
      localReceivingAudio,
      localReceivingVideo,
      localAudioPlaybackStatus,
      localVideoPlaybackStatus,
      remoteAudioReceiveStatus,
      remoteVideoReceiveStatus,
      remoteAudioPlaybackStatus,
      remoteVideoPlaybackStatus
    });

    const snapshot: MediaIoSnapshot = {
      bytes: {
        audioSent: publisherMetrics.audioBytesSent,
        audioReceived: subscriberMetrics.audioBytesReceived,
        videoSent: publisherMetrics.videoBytesSent,
        videoReceived: subscriberMetrics.videoBytesReceived
      },
      quality: {
        localJitterMs: publisherMetrics.localJitterMs,
        localLossPct: publisherMetrics.localLossPct,
        remoteJitterMs: subscriberMetrics.remoteJitterMs,
        remoteLossPct: subscriberMetrics.remoteLossPct
      },
      issues,
      matrix: {
        remoteReceivingYourVideo: remoteVideoReceiveStatus,
        remoteReceivingYourAudio: remoteAudioReceiveStatus,
        remoteAudioPlaybackStatus,
        remoteVideoPlaybackStatus,
        localReceivingYourVideo: localReceivingVideo,
        localReceivingYourAudio: localReceivingAudio,
        localAudioPlaybackStatus,
        localVideoPlaybackStatus
      },
      outages,
      ts: now
    };
    this.bus.emit("media-io", snapshot);
    if (prevAt > 0) {
      const seconds = (now - prevAt) / 1000;
      const totalSentDelta = audioSentDelta + videoSentDelta;
      const totalRecvDelta = audioRecvDelta + videoRecvDelta;
      this.callbacks.emitPeerTelemetry({
        type: "vcx-peer-telemetry",
        ts: now,
        audioPlaybackStatus: localAudioPlaybackStatus,
        videoPlaybackStatus: localVideoPlaybackStatus
      });
      const canSendPeerNetwork =
        APP_CONFIG.mediaTelemetry.enablePeerNetworkTelemetry &&
        now - this.lastPeerNetworkTelemetryAt >= APP_CONFIG.mediaTelemetry.networkTelemetryIntervalMs;
      if (canSendPeerNetwork) {
        this.lastPeerNetworkTelemetryAt = now;
        this.callbacks.emitPeerNetworkTelemetry({
          type: "vcx-peer-network",
          ts: now,
          uploadKbps: seconds > 0 ? (totalSentDelta * 8) / 1000 / seconds : null,
          downloadKbps: seconds > 0 ? (totalRecvDelta * 8) / 1000 / seconds : null,
          lossPct: subscriberMetrics.remoteLossPct,
          jitterMs: subscriberMetrics.remoteJitterMs
        });
      }
    }
  }

  private async collectPublisherMetrics(pc: RTCPeerConnection): Promise<{
    audioBytesSent: number;
    audioPacketsSent: number;
    videoBytesSent: number;
    remoteInboundAudioPacketsReceived: number | null;
    remoteInboundVideoPacketsReceived: number | null;
    localJitterMs: number | null;
    localLossPct: number | null;
  }> {
    try {
      const report = await pc.getStats();
      const minPacketsForLoss = APP_CONFIG.connectionStatus.packetLossMinPackets;
      let audioBytesSent = 0;
      let audioPacketsSent = 0;
      let videoBytesSent = 0;
      let remoteInboundAudioPacketsReceived: number | null = null;
      let remoteInboundVideoPacketsReceived: number | null = null;
      let localJitterMs: number | null = null;
      let lost = 0;
      let total = 0;

      report.forEach((s: RTCStats) => {
        const anyS = s as any;
        if (s.type === "outbound-rtp" && !anyS.isRemote) {
          if (anyS.kind === "audio" || anyS.mediaType === "audio") {
            if (typeof anyS.bytesSent === "number") audioBytesSent += anyS.bytesSent;
            if (typeof anyS.packetsSent === "number") audioPacketsSent += anyS.packetsSent;
          }
          if (anyS.kind === "video" || anyS.mediaType === "video") {
            if (typeof anyS.bytesSent === "number") videoBytesSent += anyS.bytesSent;
          }
        }
        if (s.type === "remote-inbound-rtp") {
          if (typeof anyS.jitter === "number") {
            const jitterMs = anyS.jitter * 1000;
            localJitterMs = localJitterMs === null ? jitterMs : Math.max(localJitterMs, jitterMs);
          }
          const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
          const packetsReceived = typeof anyS.packetsReceived === "number"
            ? anyS.packetsReceived
            : (typeof anyS.packetsSent === "number" ? anyS.packetsSent : 0);
          if (packetsReceived > 0) {
            lost += packetsLost;
            total += packetsLost + packetsReceived;
          }
          if ((anyS.kind === "audio" || anyS.mediaType === "audio") && typeof anyS.packetsReceived === "number") {
            remoteInboundAudioPacketsReceived = anyS.packetsReceived;
          }
          if ((anyS.kind === "video" || anyS.mediaType === "video") && typeof anyS.packetsReceived === "number") {
            remoteInboundVideoPacketsReceived = anyS.packetsReceived;
          }
        }
      });
      return {
        audioBytesSent,
        audioPacketsSent,
        videoBytesSent,
        remoteInboundAudioPacketsReceived,
        remoteInboundVideoPacketsReceived,
        localJitterMs,
        localLossPct: total >= minPacketsForLoss ? (lost / total) * 100 : null
      };
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_PUBLISHER_METRICS_FAILED, e);
      return {
        audioBytesSent: this.outboundPrev.audio,
        audioPacketsSent: this.outboundAudioPacketsPrev,
        videoBytesSent: this.outboundPrev.video,
        remoteInboundAudioPacketsReceived: null,
        remoteInboundVideoPacketsReceived: null,
        localJitterMs: null,
        localLossPct: null
      };
    }
  }

  private async collectSubscriberMetrics(subscribers: RTCPeerConnection[]): Promise<{
    audioBytesReceived: number;
    videoBytesReceived: number;
    audioPacketsReceived: number;
    videoPacketsReceived: number;
    videoFramesDecoded: number;
    remoteJitterMs: number | null;
    remoteLossPct: number | null;
    hasAudioTrack: boolean;
    hasVideoTrack: boolean;
  }> {
    const minPacketsForLoss = APP_CONFIG.connectionStatus.packetLossMinPackets;
    let audioBytesReceived = 0;
    let videoBytesReceived = 0;
    let audioPacketsReceived = 0;
    let videoPacketsReceived = 0;
    let videoFramesDecoded = 0;
    let remoteJitterMs: number | null = null;
    let lost = 0;
    let total = 0;
    let hasAudioTrack = false;
    let hasVideoTrack = false;

    await Promise.all(subscribers.map(async (pc: RTCPeerConnection) => {
      try {
        const report = await pc.getStats();
        report.forEach((s: RTCStats) => {
          const anyS = s as any;
          if (s.type === "inbound-rtp" && !anyS.isRemote) {
            if (anyS.kind === "audio" || anyS.mediaType === "audio") {
              hasAudioTrack = true;
              if (typeof anyS.bytesReceived === "number") audioBytesReceived += anyS.bytesReceived;
              if (typeof anyS.packetsReceived === "number") audioPacketsReceived += anyS.packetsReceived;
            }
            if (anyS.kind === "video" || anyS.mediaType === "video") {
              hasVideoTrack = true;
              if (typeof anyS.bytesReceived === "number") videoBytesReceived += anyS.bytesReceived;
              if (typeof anyS.packetsReceived === "number") videoPacketsReceived += anyS.packetsReceived;
              if (typeof anyS.framesDecoded === "number") videoFramesDecoded += anyS.framesDecoded;
            }
            if (typeof anyS.jitter === "number") {
              const jitterMs = anyS.jitter * 1000;
              remoteJitterMs = remoteJitterMs === null ? jitterMs : Math.max(remoteJitterMs, jitterMs);
            }
            const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
            const packetsReceived = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
            if (packetsReceived > 0) {
              lost += packetsLost;
              total += packetsLost + packetsReceived;
            }
          }
        });
      } catch (e: any) {
        Logger.error(ErrorMessages.CALL_SUBSCRIBER_METRICS_FAILED, e);
      }
    }));

    return {
      audioBytesReceived,
      videoBytesReceived,
      audioPacketsReceived,
      videoPacketsReceived,
      videoFramesDecoded,
      remoteJitterMs,
      remoteLossPct: total >= minPacketsForLoss ? (lost / total) * 100 : null,
      hasAudioTrack,
      hasVideoTrack
    };
  }

  private deriveLocalReceiveStatus(
    remotePresent: boolean,
    growthAt: number,
    now: number,
    inWarmup: boolean
  ): YesNoUnknown {
    if (!remotePresent) return "Not possible";
    if (growthAt > 0 && now - growthAt <= APP_CONFIG.mediaTelemetry.stallWindowMs) return "Yes";
    if (inWarmup) return "Pending";
    return "No";
  }

  private deriveLocalVideoPlaybackStatus(
    now: number,
    remotePresent: boolean,
    inWarmup: boolean,
    hasMeaningfulProgress: boolean,
    hasVideoTrack: boolean
  ): PlaybackState {
    if (!remotePresent) return "Not possible";
    if (!hasVideoTrack) return inWarmup ? "Pending" : "Not possible";

    const currentTime = Number.isFinite(this.remoteVideo.currentTime) ? this.remoteVideo.currentTime : 0;
    if (currentTime > this.lastRemoteVideoTime + 0.03) {
      this.lastRemoteVideoTime = currentTime;
      this.remoteVideoPlaybackAt = now;
      return "Active";
    }
    if (hasMeaningfulProgress) {
      this.remoteVideoPlaybackAt = now;
      return "Active";
    }
    if (this.remoteVideoPlaybackAt === 0 && currentTime > 0) {
      this.remoteVideoPlaybackAt = now;
      return "Active";
    }
    if (this.remoteVideoPlaybackAt === 0 && inWarmup) {
      return "Pending";
    }
    if (this.remoteVideoPlaybackAt > 0 && now - this.remoteVideoPlaybackAt <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
      return "Active";
    }
    return "Stalled";
  }

  private deriveLocalAudioPlaybackStatus(
    now: number,
    hasMeaningfulProgress: boolean,
    hasAudioTrack: boolean,
    remotePresent: boolean,
    inWarmup: boolean
  ): PlaybackState {
    if (!remotePresent) return "Not possible";
    if (!hasAudioTrack) return inWarmup ? "Pending" : "Not possible";
    if (hasMeaningfulProgress) {
      this.localAudioPlaybackAt = now;
      return "Active";
    }
    if (this.localAudioPlaybackAt === 0 && inWarmup) {
      return "Pending";
    }
    if (this.localAudioPlaybackAt > 0 && now - this.localAudioPlaybackAt <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
      return "Active";
    }
    return "Stalled";
  }

  private isMeaningfulAudioReceiveProgress(audioRecvDelta: number, audioPacketsRecvDelta: number): boolean {
    return audioRecvDelta >= APP_CONFIG.mediaTelemetry.minRecvAudioBytesPerSample ||
      audioPacketsRecvDelta >= APP_CONFIG.mediaTelemetry.minRecvAudioPacketsPerSample;
  }

  private isMeaningfulVideoReceiveProgress(
    videoRecvDelta: number,
    videoPacketsRecvDelta: number,
    videoFramesDecodedDelta: number
  ): boolean {
    return videoFramesDecodedDelta > 0 ||
      videoRecvDelta >= APP_CONFIG.mediaTelemetry.minRecvVideoBytesPerSample ||
      videoPacketsRecvDelta >= APP_CONFIG.mediaTelemetry.minRecvVideoPacketsPerSample;
  }

  private updateOutageTracking(args: {
    now: number;
    remotePresent: boolean;
    remoteHoldActive: boolean;
    localOutgoingAudioActive: boolean;
    localOutgoingVideoActive: boolean;
    localReceivingAudio: YesNoUnknown;
    localReceivingVideo: YesNoUnknown;
    localAudioPlaybackStatus: PlaybackState;
    localVideoPlaybackStatus: PlaybackState;
    remoteAudioReceiveStatus: YesNoUnknown;
    remoteVideoReceiveStatus: YesNoUnknown;
    remoteAudioPlaybackStatus: PlaybackState;
    remoteVideoPlaybackStatus: PlaybackState;
  }): MediaOutageSnapshot {
    const {
      now,
      remotePresent,
      remoteHoldActive,
      localOutgoingAudioActive,
      localOutgoingVideoActive,
      localReceivingAudio,
      localReceivingVideo,
      localAudioPlaybackStatus,
      localVideoPlaybackStatus,
      remoteAudioReceiveStatus,
      remoteVideoReceiveStatus,
      remoteAudioPlaybackStatus,
      remoteVideoPlaybackStatus
    } = args;

    this.syncOutage("local-receive-audio", remotePresent && !remoteHoldActive && localReceivingAudio === "No", "No", now);
    this.syncOutage("local-receive-video", remotePresent && !remoteHoldActive && localReceivingVideo === "No", "No", now);
    this.syncOutage("local-playback-audio", remotePresent && !remoteHoldActive && localAudioPlaybackStatus === "Stalled", "Stalled", now);
    this.syncOutage("local-playback-video", remotePresent && !remoteHoldActive && localVideoPlaybackStatus === "Stalled", "Stalled", now);
    this.syncOutage("remote-receive-audio", remotePresent && localOutgoingAudioActive && remoteAudioReceiveStatus === "No", "No", now);
    this.syncOutage("remote-receive-video", remotePresent && localOutgoingVideoActive && remoteVideoReceiveStatus === "No", "No", now);
    this.syncOutage("remote-playback-audio", remotePresent && localOutgoingAudioActive && remoteAudioPlaybackStatus === "Stalled", "Stalled", now);
    this.syncOutage("remote-playback-video", remotePresent && localOutgoingVideoActive && remoteVideoPlaybackStatus === "Stalled", "Stalled", now);
    return this.buildOutageSnapshot(now);
  }

  private syncOutage(
    key: MediaOutageKey,
    shouldBeActive: boolean,
    trigger: MediaOutageTrigger,
    now: number
  ): void {
    if (shouldBeActive) {
      this.activateOutage(key, trigger, now);
      return;
    }
    this.resolveOutage(key, now);
  }

  private activateOutage(key: MediaOutageKey, trigger: MediaOutageTrigger, now: number): void {
    const existing = this.activeOutages.get(key);
    if (existing) {
      existing.trigger = trigger;
      existing.lastObservedTs = now;
      existing.durationMs = Math.max(0, now - existing.startTs);
      return;
    }

    const definition = this.outageDefinitions[key];
    const record: MediaOutageRecord = {
      key,
      label: definition.label,
      kind: definition.kind,
      scope: definition.scope,
      mode: definition.mode,
      trigger,
      startTs: now,
      endTs: null,
      durationMs: 0,
      active: true,
      lastObservedTs: now
    };
    this.activeOutages.set(key, record);
    console.log("VCX_MEDIA_OUTAGE_START=", this.toOutageLogPayload(record));
  }

  private resolveOutage(key: MediaOutageKey, now: number): void {
    const existing = this.activeOutages.get(key);
    if (!existing) return;

    const resolved: MediaOutageRecord = {
      ...existing,
      endTs: now,
      durationMs: Math.max(0, now - existing.startTs),
      active: false,
      lastObservedTs: now
    };
    this.activeOutages.delete(key);
    this.recentOutages = [resolved, ...this.recentOutages].slice(0, this.maxRecentOutages);
    console.log("VCX_MEDIA_OUTAGE_END=", this.toOutageLogPayload(resolved));
  }

  private resolveAllActiveOutages(now: number): void {
    for (const key of Array.from(this.activeOutages.keys())) {
      this.resolveOutage(key, now);
    }
  }

  private buildOutageSnapshot(now: number): MediaOutageSnapshot {
    return {
      active: Array.from(this.activeOutages.values())
        .sort((a, b) => a.startTs - b.startTs)
        .map((record: MediaOutageRecord) => ({
          ...record,
          durationMs: Math.max(0, now - record.startTs)
        })),
      recent: this.recentOutages.map((record: MediaOutageRecord) => ({ ...record })),
      ts: now
    };
  }

  private toOutageLogPayload(record: MediaOutageRecord): Record<string, unknown> {
    return {
      key: record.key,
      label: record.label,
      scope: record.scope,
      kind: record.kind,
      mode: record.mode,
      trigger: record.trigger,
      active: record.active,
      startAt: new Date(record.startTs).toISOString(),
      endAt: record.endTs === null ? null : new Date(record.endTs).toISOString(),
      durationMs: record.durationMs
    };
  }
}
