// import { HttpClient } from "../core/http/HttpClient";
// import { ImsClient } from "../core/clients/ims/ImsClient";

class CallController {

  private gateway: JanusGateway;
  private media: MediaManager;
  private roster = new ParticipantRoster();

  private plugin: any = null;
  private privateId: number | null = null;
  private selfId: number | null = null;
  private remoteFeeds: RemoteFeedManager | null = null;

  private joinedRoom = false;
  private roomCreateAttempted = false;

  private cameraStream: MediaStream | null = null;
  private screenEnabled = false;
  private vbEnabled = false;

  private screenManager = new ScreenShareManager();
  private vbManager: VirtualBackgroundManager;

  // Ã¢Å“â€¦ CLEAN recording state
  private recording = false;
  private currentRecordingId: string | null = null;
  private currentRoomId: number | null = null;
  private participantSyncTimer: number | null = null;
  private participantSyncInFlight = false;
  private lastParticipantSyncAt = 0;
  private connectionEngine: ConnectionStatusEngine;
  private activeJoinCfg: JoinConfig | null = null;
  private retryTimer: number | null = null;
  private serverRetryAttempt = 0;
  private peerRetryAttempt = 0;
  private isLeaving = false;
  private suppressPublisherCleanupRetry = false;
  private suppressRemoteFeedRetry = false;
  private participantSyncRequestTimer: number | null = null;
  private participantSyncRequestSeq = 0;
  private readonly recordingRetryDelayMs = 700;
  private cameraStreamOrientation: "portrait" | "landscape" | null = null;
  private publisherPc: RTCPeerConnection | null = null;
  private subscriberPcs = new Map<number, RTCPeerConnection>();
  private localVideoEnabled = true;
  private videoToggleBusy = false;
  private screenToggleBusy = false;
  private vbToggleBusy = false;
  private monitoringStat: CallMonitoringStat;
  private peerTelemetryByFeed = new Map<number, PeerPlaybackTelemetry>();
  private mixedAudioContext: AudioContext | null = null;
  private mixedAudioTrack: MediaStreamTrack | null = null;
  private callId: string | null = null;

  constructor(
    private bus: EventBus,
    private localVideo: HTMLVideoElement,
    private remoteVideo: HTMLVideoElement
  ) {
    this.gateway = new JanusGateway();
    this.media = new MediaManager();
    this.vbManager = new VirtualBackgroundManager();
    this.vbManager.setSourceProvider(async () => {
      try {
        return await this.ensureCameraStream();
      } catch {
        return null;
      }
    });
    this.connectionEngine = new ConnectionStatusEngine((status: ConnectionStatusView) => {
      this.bus.emit("connection-status", status);
    });
    this.bus.emit("connection-status", this.connectionEngine.getStatus());
    this.gateway.init();
    this.monitoringStat = new CallMonitoringStat(this.bus, this.remoteVideo, {
      getJoinedRoom: () => this.joinedRoom,
      getPublisherPc: () => this.publisherPc,
      getSubscriberPcs: () => Array.from(this.subscriberPcs.values()),
      getRemoteParticipantCount: () => {
        return this.roster.snapshot(this.currentRoomId ?? 0).participantIds
          .filter((id: number) => id !== this.selfId)
          .length;
      },
      getPreferredAudioTrack: () => this.getPreferredAudioTrack(),
      isLocalAudioMuted: () => {
        return typeof this.plugin?.isAudioMuted === "function" && this.plugin.isAudioMuted();
      },
      getPeerTelemetry: (now: number) => this.pickFreshPeerTelemetry(now),
      emitPeerTelemetry: (payload: PeerPlaybackTelemetry) => this.sendPeerTelemetry(payload)
    });
  }

  async join(cfg: JoinConfig, opts?: { internalRetry?: boolean }) {
    if (!opts?.internalRetry || !this.callId) {
      this.callId = Correlation.newId();
    }
    this.activeJoinCfg = cfg;
    this.isLeaving = false;
    this.localVideoEnabled = true;
    this.suppressPublisherCleanupRetry = false;
    if (!opts?.internalRetry) {
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;
      this.clearRetryTimer();
    }
    Logger.user(`[call] join start callId=${this.callId} roomId=${cfg.roomId} participantId=${cfg.participantId ?? "n/a"}`);
    this.bus.emit("telemetry-context", {
      callId: this.callId,
      roomId: cfg.roomId,
      participantId: cfg.participantId ?? null
    });
    this.connectionEngine.onJoinStarted();
    try {
      const server = UrlConfig.getVcxServer().server;
      const clientId = UrlConfig.getVcxServer().client_id;

      const http: HttpClient = new HttpClient(server, clientId);
      const ims = new ImsClient(http);
      const payload = await ims.getMediaConstraints();

      this.gateway.createSession(
        cfg.server,
        payload.PC_CONFIG?.iceServers,
        () => {
          this.connectionEngine.onSessionReady();
          this.attachAndEnsureRoomThenJoin(cfg);
        },
        () => {
          this.connectionEngine.onSessionDestroyed();
          this.scheduleServerRetry("Janus session destroyed");
        },
        (e: any) => {
          this.scheduleServerRetry(`Janus session create failed: ${JSON.stringify(e)}`);
        }
      );
    } catch (e: any) {
      const requestId = String(e?.requestId || "n/a");
      Logger.error(ErrorMessages.callJoinFailed(this.callId ?? "n/a", cfg.roomId, requestId), e);
      this.scheduleServerRetry(ErrorMessages.callJoinError(e?.message || e));
    }
  }

  private clearRetryTimer() {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private clearParticipantSyncRequestTimer() {
    if (this.participantSyncRequestTimer !== null) {
      window.clearTimeout(this.participantSyncRequestTimer);
      this.participantSyncRequestTimer = null;
    }
  }

  private cleanupForRetry() {
    this.suppressRemoteFeedRetry = true;
    this.stopMediaStatsLoop();
    this.clearMixedAudioResources();
    this.vbManager.disable();
    this.vbEnabled = false;
    this.screenManager.stop();
    this.screenEnabled = false;
    this.peerTelemetryByFeed.clear();
    this.remoteFeeds?.cleanupAll();
    this.remoteFeeds = null;
    this.plugin = null;
    this.stopParticipantSync();
    this.joinedRoom = false;
    this.roomCreateAttempted = false;
    this.privateId = null;
    this.selfId = null;
    this.publisherPc = null;
    this.subscriberPcs.clear();
    this.localVideoEnabled = true;
    this.videoToggleBusy = false;
    this.screenToggleBusy = false;
    this.vbToggleBusy = false;
    this.recording = false;
    this.currentRecordingId = null;
    this.currentRoomId = null;
    this.roster.reset();
    this.bus.emit("recording-changed", false);
    this.bus.emit("joined", false);

    this.suppressPublisherCleanupRetry = true;
    this.gateway.destroy();
  }

  private scheduleServerRetry(reason: string) {
    this.scheduleRetry("server", reason);
  }

  private schedulePeerRetry(reason: string) {
    this.scheduleRetry("peer", reason);
  }

  private scheduleRetry(kind: "server" | "peer", reason: string) {
    if (this.isLeaving) return;
    const cfg = this.activeJoinCfg;
    if (!cfg) return;
    if (this.retryTimer !== null) return;

    const maxAttempts = kind === "server"
      ? APP_CONFIG.call.retry.serverMaxAttempts
      : APP_CONFIG.call.retry.peerMaxAttempts;
    const delayMs = kind === "server"
      ? APP_CONFIG.call.retry.serverDelayMs
      : APP_CONFIG.call.retry.peerDelayMs;

    const attempt = kind === "server"
      ? ++this.serverRetryAttempt
      : ++this.peerRetryAttempt;

    if (kind === "server") {
      this.peerRetryAttempt = 0;
    } else {
      this.serverRetryAttempt = 0;
    }

    if (attempt > maxAttempts) {
      this.connectionEngine.onFailed();
      Logger.setStatus(ErrorMessages.callRetryLimitStatus(kind));
      Logger.error(ErrorMessages.callRetryExhausted(kind, this.callId ?? "n/a", cfg.roomId, reason));
      return;
    }

    if (kind === "server") {
      this.connectionEngine.onServerRetrying(attempt, maxAttempts);
      Logger.setStatus(ErrorMessages.callServerRetrying(attempt, maxAttempts));
    } else {
      this.connectionEngine.onPeerRetrying(attempt, maxAttempts);
      Logger.setStatus(ErrorMessages.callPeerRetrying(attempt, maxAttempts));
    }
    Logger.warn(ErrorMessages.callRetryScheduled(kind, attempt, maxAttempts, this.callId ?? "n/a", cfg.roomId, reason));

    this.cleanupForRetry();
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      this.join(cfg, { internalRetry: true });
    }, delayMs);
  }

  private attachAndEnsureRoomThenJoin(cfg: JoinConfig) {

    this.gateway.attachPublisher(
      (h: any) => {

        this.plugin = h;
        this.joinedRoom = false;
        this.roomCreateAttempted = false;
        this.selfId = null;
        this.publisherPc = null;
        this.subscriberPcs.clear();
        this.roster.reset();
        this.stopParticipantSync();

        // reset recording
        this.recording = false;
        this.currentRecordingId = null;
        this.bus.emit("recording-changed", false);
        this.connectionEngine.onPublisherAttached();

        Logger.setStatus(ErrorMessages.CALL_PLUGIN_ATTACHED_CHECKING_ROOM);
        this.ensureRoomThenJoin(cfg);
      },
      (msg: any, jsep: any) => this.onPublisherMessage(cfg, msg, jsep),
      (track: any, on: any) => {
        if (track && typeof track.kind === "string") {
          this.connectionEngine.onLocalTrackSignal(track, !!on);
        }
      },
      () => {
        if (this.isLeaving || this.suppressPublisherCleanupRetry) return;
        this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
        Logger.setStatus(ErrorMessages.CALL_PUBLISHER_CLEANUP_RECOVERING);
        this.schedulePeerRetry("Publisher cleanup");
      },
      (e: any) => {
        this.scheduleServerRetry(`Attach publisher failed: ${JSON.stringify(e)}`);
      }
    );
  }

  private getVideoRoomData(msg: any) {
    return msg?.plugindata?.data ?? msg;
  }

  private ensureRoomThenJoin(cfg: JoinConfig) {

    if (!this.plugin) return;

    this.plugin.send({
      message: { request: "exists", room: cfg.roomId },
      success: (res: any) => {

        const data = this.getVideoRoomData(res);
        const exists = !!data?.exists;

        if (exists) {
          Logger.setStatus(ErrorMessages.CALL_ROOM_EXISTS_JOINING);
          this.sendPublisherJoin(cfg);
        } else {
          Logger.setStatus(ErrorMessages.CALL_ROOM_NOT_FOUND_CREATING);
          this.roomCreateAttempted = true;
          this.sendCreateRoom(cfg);
        }
      },
      error: () => {
        this.scheduleServerRetry("Room exists check failed");
      }
    });
  }

  private sendPublisherJoin(cfg: JoinConfig) {
    if (!this.plugin) return;
    const message: any = {
      request: "join",
      room: cfg.roomId,
      ptype: "publisher",
      display: cfg.display
    };
    if (typeof cfg.participantId === "number" && Number.isFinite(cfg.participantId)) {
      message.id = cfg.participantId;
    }
    this.plugin.send({
      message
    });
  }

  private sendCreateRoom(cfg: JoinConfig) {

    if (!this.plugin) return;

    this.plugin.send({
      message: {
        request: "create",
        room: cfg.roomId,
        publishers: APP_CONFIG.videoroom.maxPublishers,
        description: `Room ${cfg.roomId}`,
        videocodec: CodecSupportUtil.getRoomVideoCodecList()
      },
      success: () => {
        Logger.setStatus(ErrorMessages.CALL_ROOM_CREATED_JOINING);
        this.sendPublisherJoin(cfg);
      },
      error: () => {
        this.scheduleServerRetry("Create room failed");
      }
    });
  }

  private handlePublisherJoinError(cfg: JoinConfig, data: any, errorCodeRaw: unknown): boolean {
    const errorCode = JoinErrorUtils.parseErrorCode(errorCodeRaw);
    const errorText = JoinErrorUtils.extractErrorText(data);

    if (errorCode === ErrorCodes.JANUS_ROOM_NOT_FOUND) {
      if (!this.roomCreateAttempted) {
        this.roomCreateAttempted = true;
        this.sendCreateRoom(cfg);
      } else {
        this.scheduleServerRetry(ErrorMessages.callRoomJoinFailedAfterCreateAttempt(String(ErrorCodes.JANUS_ROOM_NOT_FOUND)));
      }
      return true;
    }

    if (JoinErrorUtils.isParticipantIdCollisionError(errorCode, errorText)) {
      const msg = ErrorMessages.CALL_PARTICIPANT_ID_IN_USE;
      Logger.error(ErrorMessages.callParticipantIdCollision(
        this.callId ?? "n/a",
        cfg.roomId,
        String(cfg.participantId ?? "n/a"),
        String(errorCode ?? "n/a"),
        errorText
      ));
      Logger.setStatus(msg);
      this.connectionEngine.setFatalError(msg, ErrorMessages.CALL_PARTICIPANT_ID_IN_USE_SECONDARY);
      this.bus.emit("joined", false);
      return true;
    }

    const unauthorized = JoinErrorUtils.isUnauthorizedJoinError(errorCode, errorText);
    if (unauthorized) {
      const msg = ErrorMessages.CALL_AUTHORIZATION_FAILED;
      Logger.error(ErrorMessages.callUnauthorizedJoin(
        this.callId ?? "n/a",
        cfg.roomId,
        String(errorCode ?? "n/a"),
        errorText
      ));
      Logger.setStatus(msg);
      this.connectionEngine.setFatalError(msg, ErrorMessages.CALL_AUTHORIZATION_FAILED_SECONDARY);
      this.bus.emit("joined", false);
      return true;
    }

    const roomMissing = JoinErrorUtils.isRoomMissingError(errorText);
    if (roomMissing) {
      if (!this.roomCreateAttempted) {
        this.roomCreateAttempted = true;
        this.sendCreateRoom(cfg);
      } else {
        this.scheduleServerRetry(ErrorMessages.callRoomMissingAfterCreate(String(errorCode ?? "n/a")));
      }
      return true;
    }

    this.scheduleServerRetry(ErrorMessages.callPublisherJoinError(
      String(errorCode ?? "n/a"),
      errorText || JSON.stringify(data)
    ));
    return true;
  }

  private onPublisherMessage(cfg: JoinConfig, msg: any, jsep: any) {
    if (msg?.janus === "hangup") {
      const reason = String(msg?.reason || "Peer hangup");
      Logger.error(ErrorMessages.callPublisherHangup(reason));
      if (reason.toLowerCase().includes("ice")) {
        this.schedulePeerRetry(`Publisher hangup: ${reason}`);
      }
      return;
    }

    const data = this.getVideoRoomData(msg);
    const event = data["videoroom"];
    const errorCode = data["error_code"];
    if (data?.error || errorCode) {
      Logger.error(ErrorMessages.callPublisherPluginError(data));
      if (!this.joinedRoom && this.handlePublisherJoinError(cfg, data, errorCode)) {
        return;
      }
    }

    if (event === "joined") {

      this.joinedRoom = true;
      this.currentRoomId = cfg.roomId;
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;
      this.clearRetryTimer();
      this.suppressRemoteFeedRetry = false;
      this.connectionEngine.onJoinedRoom();

      const myId = data["id"];
      this.privateId = data["private_id"];
      this.selfId = myId;
      this.roster.setSelf(myId);

      Logger.setStatus(ErrorMessages.CALL_JOINED_PUBLISHING);

      this.remoteFeeds = new RemoteFeedManager(
        this.gateway.getJanus(),
        cfg.roomId,
        this.privateId!,
        this.gateway.getOpaqueId(),
        this.media,
        this.remoteVideo,
        {
          onSubscriberPcReady: (feedId: number, pc: RTCPeerConnection) => {
            this.subscriberPcs.set(feedId, pc);
            this.connectionEngine.registerSubscriberPc(feedId, pc);
          },
          onRemoteTrackSignal: (feedId: number, track: MediaStreamTrack, on: boolean) => {
            this.connectionEngine.onRemoteTrackSignal(feedId, track, on);
          },
          onRemoteTelemetry: (feedId: number, payload: PeerPlaybackTelemetry) => {
            this.peerTelemetryByFeed.set(feedId, payload);
          },
          onRemoteFeedCleanup: (feedId: number) => {
            this.subscriberPcs.delete(feedId);
            this.peerTelemetryByFeed.delete(feedId);
            this.connectionEngine.unregisterSubscriber(feedId);
            if (this.isLeaving || this.suppressRemoteFeedRetry) {
              Logger.warn(`Remote feed ${feedId} cleanup ignored (controlled cleanup)`);
              return;
            }
            if (this.remoteFeeds && this.roster.has(feedId) && feedId !== this.selfId) {
              Logger.warn(`Remote feed ${feedId} cleaned up. Scheduling re-subscribe.`);
              window.setTimeout(() => {
                this.remoteFeeds?.addFeed(feedId);
              }, APP_CONFIG.call.remoteFeedRetryDelayMs);
            }
          },
          onRemoteFeedRetryExhausted: (feedId: number, attempts: number) => {
            this.subscriberPcs.delete(feedId);
            this.connectionEngine.onRemoteFeedRetryExhausted(feedId, attempts);
            Logger.setStatus(ErrorMessages.CALL_REMOTE_VIDEO_UNSTABLE);
            Logger.error(ErrorMessages.callRemoteFeedRetryExhausted(this.callId ?? "n/a", cfg.roomId, feedId, attempts));
          }
        }
      );

      this.publish();
      this.reconcile(cfg, data["publishers"]);
      this.bus.emit("joined", true);
      this.bus.emit("video-mute-changed", !this.localVideoEnabled);
      this.startParticipantSync(cfg);
      this.startMediaStatsLoop();
    }

    if (event === "event") {
      this.reconcile(cfg, data["publishers"]);

      const leaving = data["leaving"];
      if (typeof leaving === "number") {
        this.removeParticipant(cfg, leaving);
      }

      const unpublished = data["unpublished"];
      if (typeof unpublished === "number") {
        this.removeParticipant(cfg, unpublished);
      }

      this.syncParticipantsFromServer(cfg);
    }

    if (event === "destroyed") {
      this.scheduleServerRetry("Video room destroyed event");
      return;
    }

    if (jsep) this.plugin.handleRemoteJsep({ jsep });
  }

  private reconcile(cfg: JoinConfig, publishers: any) {
    if (!publishers) return;
    publishers.forEach((p: any) => {
      const feedId = Number(p?.id);
      if (!Number.isFinite(feedId)) return;

      this.roster.add(feedId);
      if (this.remoteFeeds && feedId !== this.selfId) {
        this.connectionEngine.onSubscriberRequested();
        this.remoteFeeds.addFeed(feedId);
      }
    });

    this.publishParticipants(cfg);
  }

  private publishParticipants(cfg: JoinConfig) {
    const snapshot = this.roster.snapshot(cfg.roomId);
    this.bus.emit("participants", snapshot);

    const remoteCount = snapshot.participantIds
      .filter((id: number) => id !== this.selfId)
      .length;
    this.connectionEngine.setRemoteParticipantCount(remoteCount);
  }

  private startParticipantSync(cfg: JoinConfig) {
    this.stopParticipantSync();
    this.syncParticipantsFromServer(cfg);
    this.participantSyncTimer = window.setInterval(() => {
      this.syncParticipantsFromServer(cfg);
    }, APP_CONFIG.call.participantSyncIntervalMs);
  }

  private stopParticipantSync() {
    if (this.participantSyncTimer !== null) {
      window.clearInterval(this.participantSyncTimer);
      this.participantSyncTimer = null;
    }
    this.clearParticipantSyncRequestTimer();
    this.participantSyncRequestSeq = 0;
    this.participantSyncInFlight = false;
    this.lastParticipantSyncAt = 0;
  }

  private syncParticipantsFromServer(cfg: JoinConfig) {
    if (!this.plugin || !this.joinedRoom) return;
    if (this.participantSyncInFlight) return;

    const now = Date.now();
    if (now - this.lastParticipantSyncAt < APP_CONFIG.call.participantSyncCooldownMs) return;
    this.lastParticipantSyncAt = now;
    this.participantSyncInFlight = true;
    const requestSeq = ++this.participantSyncRequestSeq;
    this.clearParticipantSyncRequestTimer();
    this.participantSyncRequestTimer = window.setTimeout(() => {
      if (!this.participantSyncInFlight || requestSeq !== this.participantSyncRequestSeq) return;
      this.participantSyncInFlight = false;
      this.participantSyncRequestTimer = null;
      Logger.error(ErrorMessages.callListParticipantsTimeout(requestSeq, cfg.roomId));
    }, APP_CONFIG.call.participantSyncRequestTimeoutMs);

    this.plugin.send({
      message: { request: "listparticipants", room: cfg.roomId },
      success: (res: any) => {
        if (requestSeq !== this.participantSyncRequestSeq) return;
        this.clearParticipantSyncRequestTimer();
        const data = this.getVideoRoomData(res);
        const participants = Array.isArray(data?.participants) ? data.participants : [];
        const serverIds = new Set<number>();

        participants.forEach((p: any) => {
          const feedId = Number(p?.id);
          if (!Number.isFinite(feedId)) return;
          serverIds.add(feedId);
          this.roster.add(feedId);
          if (this.remoteFeeds && feedId !== this.selfId) {
            this.remoteFeeds.addFeed(feedId);
          }
        });

        const localIds = this.roster.snapshot(cfg.roomId).participantIds;
        localIds.forEach((id: number) => {
          if (id === this.selfId) return;
          if (!serverIds.has(id)) {
            this.roster.remove(id);
            this.remoteFeeds?.removeFeed(id);
          }
        });

        this.publishParticipants(cfg);
        this.participantSyncInFlight = false;
      },
      error: (e: any) => {
        if (requestSeq !== this.participantSyncRequestSeq) return;
        this.clearParticipantSyncRequestTimer();
        this.participantSyncInFlight = false;
        Logger.error(ErrorMessages.callListParticipantsError(requestSeq, e));
      }
    });
  }

  private removeParticipant(cfg: JoinConfig, feedId: number) {
    if (feedId === this.selfId) return;
    this.roster.remove(feedId);
    this.subscriberPcs.delete(feedId);
    this.peerTelemetryByFeed.delete(feedId);
    this.remoteFeeds?.removeFeed(feedId);
    this.publishParticipants(cfg);
  }

  // =====================================
  // MEDIA
  // =====================================

  private getVideoConfig(): VcxVideoConfig {
    const cfg = UrlConfig.getVcxVideoConfig();
    const bitrateBps = Number.isFinite(cfg.bitrate_bps) ? Math.floor(cfg.bitrate_bps) : APP_CONFIG.media.bitrateBps;
    const maxFramerate = Number.isFinite(cfg.max_framerate) ? Math.floor(cfg.max_framerate) : APP_CONFIG.media.maxFramerate;

    return {
      bitrate_bps: Math.max(APP_CONFIG.media.minBitrateBps, Math.min(APP_CONFIG.media.maxBitrateBps, bitrateBps)),
      bitrate_cap: cfg.bitrate_cap !== false,
      max_framerate: Math.max(APP_CONFIG.media.minFramerate, Math.min(APP_CONFIG.media.maxFramerateCap, maxFramerate))
    };
  }

  private tuneVideoSenderBitrate(pc: RTCPeerConnection, bitrateBps: number, maxFramerate: number) {
    try {
      const sender = pc.getSenders().find(s => s.track?.kind === "video");
      if (!sender || typeof sender.getParameters !== "function" || typeof sender.setParameters !== "function") return;

      const p = sender.getParameters();
      const encodings = (p.encodings && p.encodings.length > 0) ? p.encodings : [{} as RTCRtpEncodingParameters];
      encodings[0].maxBitrate = bitrateBps;
      encodings[0].maxFramerate = maxFramerate;
      p.encodings = encodings;

      sender.setParameters(p).catch((e: any) => {
        Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_ERROR, e);
      });
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_HOOK_ERROR, e);
    }
  }

  private isIOSDevice(): boolean {
    const ua = navigator.userAgent || "";
    const isiPhoneFamily = /iPad|iPhone|iPod/i.test(ua);
    const iPadOSDesktopUA = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return isiPhoneFamily || iPadOSDesktopUA;
  }

  private getViewportOrientation(): "portrait" | "landscape" {
    return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
  }

  private buildIOSVideoConstraints(orientation: "portrait" | "landscape"): MediaTrackConstraints {
    if (orientation === "portrait") {
      return {
        facingMode: "user",
        width: { ideal: 480 },
        height: { ideal: 640 },
        frameRate: { ideal: 15, max: 20 }
      };
    }
    return {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 15, max: 20 }
    };
  }

  private async getPublishTracks(): Promise<any[]> {
    const stream = await this.ensureCameraStream();
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    if (!audioTrack || !videoTrack) {
      throw new Error(ErrorMessages.CALL_CAMERA_MIC_TRACK_UNAVAILABLE);
    }

    // Ensure local preview and connectivity state are updated even when
    // browser/Janus onlocaltrack callback is delayed or missing.
    this.connectionEngine.onLocalTrackSignal(videoTrack, true);
    this.media.setLocalTrack(this.localVideo, videoTrack);

    const tracks: any[] = [
      { type: "audio", capture: audioTrack, recv: false },
      { type: "video", capture: videoTrack, recv: false }
    ];
    if (APP_CONFIG.mediaTelemetry.enablePeerTelemetry) {
      tracks.push({ type: "data" });
    }
    return tracks;
  }

  // public publish() {
  //   this.plugin.createOffer({
  //     tracks: [
  //       { type: "audio", capture: true, recv: false },
  //       { type: "video", capture: true, recv: false }
  //     ],
  //     success: (jsep: any) => {
  //       this.plugin.send({
  //         message: { request: "configure", audio: true, video: true },
  //         jsep
  //       });
  //     }
  //   });
  // }

  public async publish() {
    if (!this.plugin) {
      Logger.setStatus(ErrorMessages.CALL_PUBLISH_IGNORED_PLUGIN_NOT_READY);
      return;
    }
    const videoCfg = this.getVideoConfig();
    let tracks: any[];

    try {
      tracks = await this.getPublishTracks();
    } catch (e: any) {
      const classified = MediaErrorUtils.classifyPublishError(e);
      Logger.setStatus(classified.userMessage);
      Logger.error(classified.userMessage, e);
      this.connectionEngine.setFatalError(
        classified.userMessage,
        ErrorMessages.CALL_FIX_CAMERA_MIC_AND_RECONNECT
      );
      return;
    }

    const codecOrder = CodecSupportUtil.getPublishCodecAttemptOrder();
    this.attemptPublishWithCodec(tracks, videoCfg, codecOrder, 0);
  }

  private attemptPublishWithCodec(
    tracks: any[],
    videoCfg: VcxVideoConfig,
    codecOrder: Array<"vp8" | "vp9">,
    attemptIndex: number
  ) {
    if (!this.plugin) return;
    const codec = codecOrder[attemptIndex];
    if (!codec) {
      this.handlePublishFailure(new Error("No publish codec available"));
      return;
    }

    Logger.user(`[publish] createOffer videocodec=${codec} attempt=${attemptIndex + 1}/${codecOrder.length}`);

    this.plugin.createOffer({
      tracks,
      success: (jsep: any) => {
        this.bindPublisherConnectivity(videoCfg);
        this.plugin.send({
          message: {
            request: "configure",
            audio: true,
            video: true,
            data: APP_CONFIG.mediaTelemetry.enablePeerTelemetry,
            bitrate: videoCfg.bitrate_bps,
            bitrate_cap: videoCfg.bitrate_cap,
            videocodec: codec
          },
          jsep,
          success: (res: any) => {
            const data = this.getVideoRoomData(res);
            if (data?.error || data?.error_code) {
              this.fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, data);
            }
          },
          error: (e: any) => {
            this.fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, e);
          }
        });
      },
      error: (e: any) => {
        this.fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, e);
      }
    });
  }

  private fallbackOrHandlePublishFailure(
    codecOrder: Array<"vp8" | "vp9">,
    attemptIndex: number,
    tracks: any[],
    videoCfg: VcxVideoConfig,
    error: unknown
  ) {
    const canFallback = APP_CONFIG.media.enableVideoCodecFallback && (attemptIndex + 1) < codecOrder.length;
    if (canFallback) {
      const currentCodec = codecOrder[attemptIndex];
      const nextCodec = codecOrder[attemptIndex + 1];
      Logger.warn(`[publish] videocodec=${currentCodec} failed. Falling back to ${nextCodec}.`);
      this.attemptPublishWithCodec(tracks, videoCfg, codecOrder, attemptIndex + 1);
      return;
    }
    this.handlePublishFailure(error);
  }

  private bindPublisherConnectivity(videoCfg: VcxVideoConfig) {
    // Capture and emit connectivity info from RTCPeerConnection.
    try {
      // TODO: If Janus internals change and webrtcStuff.pc is unavailable, bind the publisher PC from Janus plugin callbacks.
      const pc: RTCPeerConnection | undefined = this.plugin?.webrtcStuff?.pc;

      if (pc) {
        this.publisherPc = pc;
        this.connectionEngine.registerPublisherPc(pc);
        this.tuneVideoSenderBitrate(pc, videoCfg.bitrate_bps, videoCfg.max_framerate);
        const emit = () => {
          const payload = {
            ice: pc.iceConnectionState,
            signaling: pc.signalingState,
            connection: (pc as any).connectionState ?? "n/a",
            gathering: pc.iceGatheringState,
            ts: Date.now(),
          };

          console.log("VCX_CONNECTIVITY=", payload);
          this.bus.emit("connectivity", payload);
        };

        // emit once immediately
        emit();

        pc.oniceconnectionstatechange = () => {
          console.log("VCX_ICE=" + pc.iceConnectionState);
          emit();
          if (pc.iceConnectionState === "failed") {
            this.schedulePeerRetry("Publisher ICE state failed");
          }
        };

        pc.onsignalingstatechange = () => {
          console.log("VCX_SIGNALING=" + pc.signalingState);
          emit();
        };

        // connectionState exists on modern browsers; not always present everywhere
        (pc as any).onconnectionstatechange = () => {
          console.log("VCX_CONNECTION=" + ((pc as any).connectionState ?? "n/a"));
          emit();
          if ((pc as any).connectionState === "failed") {
            this.schedulePeerRetry("Publisher connection state failed");
          }
        };

        pc.onicegatheringstatechange = () => {
          console.log("VCX_GATHERING=" + pc.iceGatheringState);
          emit();
        };
      } else {
        this.publisherPc = null;
        console.log("VCX_CONNECTIVITY=pc_not_available");
        this.bus.emit("connectivity", {
          ice: "n/a",
          signaling: "n/a",
          connection: "n/a",
          gathering: "n/a",
          ts: Date.now(),
        });
      }
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_CONNECTIVITY_HOOK_ERROR, e);
    }
  }

  private handlePublishFailure(e: unknown) {
    const classified = MediaErrorUtils.classifyPublishError(e);
    console.error(ErrorMessages.CALL_OFFER_ERROR_CONSOLE_TAG, e);
    Logger.setStatus(classified.userMessage);
    Logger.error(classified.userMessage, e);
    if (!classified.retryable) {
      this.connectionEngine.setFatalError(
        classified.userMessage,
        ErrorMessages.CALL_FIX_CAMERA_MIC_AND_RECONNECT
      );
      return;
    }
    this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
    Logger.setStatus(ErrorMessages.CALL_OFFER_ERROR_RECOVERING);
    this.schedulePeerRetry(ErrorMessages.callOfferErrorReason(e));
  }

  toggleMute() {
    if (!this.plugin) return;
    const m = this.plugin.isAudioMuted();
    m ? this.plugin.unmuteAudio() : this.plugin.muteAudio();
    this.bus.emit("mute-changed", !m);
  }

  async setVideoEnabled(enabled: boolean): Promise<boolean> {
    if (!this.plugin) return this.localVideoEnabled;
    if (this.videoToggleBusy) return this.localVideoEnabled;
    this.videoToggleBusy = true;
    try {
      if (enabled) {
        let track: MediaStreamTrack | undefined;
        if (this.vbEnabled) {
          const vbSourceTrack = this.vbManager.getSourceStream()?.getVideoTracks()[0] ?? this.cameraStream?.getVideoTracks()[0];
          if (vbSourceTrack) vbSourceTrack.enabled = true;
        }
        if (this.screenEnabled) {
          track = this.screenManager.getStream()?.getVideoTracks()[0];
        } else if (this.vbEnabled) {
          track = this.vbManager.getOutputStream()?.getVideoTracks()[0];
        }
        if (!track) {
          const cam = await this.ensureCameraStream();
          track = cam.getVideoTracks()[0];
        }
        if (track) {
          track.enabled = true;
          this.replaceVideoTrack(track);
        }
        await this.ensureOutgoingAudio({ camera: this.cameraStream });
        try {
          if (typeof this.plugin.unmuteVideo === "function") {
            this.plugin.unmuteVideo();
          } else {
            this.plugin.send({ message: { request: "configure", video: true } });
          }
        } catch (e: any) {
          Logger.error(ErrorMessages.CALL_VIDEO_UNMUTE_SIGNALING_FAILED, e);
        }
        this.localVideoEnabled = true;
      } else {
        try {
          if (typeof this.plugin.muteVideo === "function") {
            this.plugin.muteVideo();
          } else {
            this.plugin.send({ message: { request: "configure", video: false } });
          }
        } catch (e: any) {
          Logger.error(ErrorMessages.CALL_VIDEO_MUTE_SIGNALING_FAILED, e);
        }
        const localTrack = this.screenEnabled
          ? this.screenManager.getStream()?.getVideoTracks()[0]
          : this.vbEnabled
            ? this.vbManager.getOutputStream()?.getVideoTracks()[0]
            : this.cameraStream?.getVideoTracks()[0];
        if (localTrack) {
          localTrack.enabled = false;
          this.connectionEngine.onLocalTrackSignal(localTrack, false);
        }
        this.localVideoEnabled = false;
      }
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_VIDEO_TOGGLE_FAILED, e);
      Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
    } finally {
      this.videoToggleBusy = false;
      this.bus.emit("video-mute-changed", !this.localVideoEnabled);
    }
    return this.localVideoEnabled;
  }

  markRetrying() {
    this.connectionEngine.onReconnect();
  }

  public getNetworkQualityPeers(): { publisher: RTCPeerConnection | null; subscribers: RTCPeerConnection[] } {
    return {
      publisher: this.publisherPc,
      subscribers: Array.from(this.subscriberPcs.values())
    };
  }

  stopVideo() {
    void this.setVideoEnabled(false);
  }

  // =====================================
  // RECORDING
  // =====================================

  private endCallOnRecordingFailure(message: string, err?: unknown) {
    Logger.error(ErrorMessages.callRecordingLog(message), err);
    Logger.setStatus(ErrorMessages.CALL_RECORDING_FAILED_ENDING);
    this.recording = false;
    this.currentRecordingId = null;
    this.bus.emit("recording-changed", false);
    if (!this.isLeaving) this.leave();
  }

  public startRecording(recordingId: string, attempt: number = 1) {

    if (!this.plugin || !this.joinedRoom) return;
    if (this.recording) return;

    this.currentRecordingId = recordingId;
    const recordingIdRandom = Math.floor(100000 + Math.random() * 900000);
    this.plugin.send({
    message: {
          request: "enable_recording",
          record: true,
          room: this.currentRoomId,
          recordingId: recordingIdRandom,
          participantId: this.activeJoinCfg?.participantId
      },
      success: () => {
        this.recording = true;
        Logger.setStatus(ErrorMessages.callRecordingStarted(recordingId));
        this.bus.emit("recording-changed", true);
      },
      error: (e: any) => {
        Logger.error(ErrorMessages.callRecordingStartFailed(attempt), e);
        this.recording = false;
        this.bus.emit("recording-changed", false);
        if (attempt < 2) {
          Logger.setStatus(ErrorMessages.CALL_RECORDING_START_RETRYING);
          window.setTimeout(() => this.startRecording(recordingId, attempt + 1), this.recordingRetryDelayMs);
          return;
        }
        this.endCallOnRecordingFailure("start failed after retry", e);
      }
    });
  }

  public stopRecording(attempt: number = 1) {

    if (!this.plugin || !this.recording) return;

    this.plugin.send({
      message: { request: "enable_recording", record: false, room: this.currentRoomId },
      success: () => {
        this.recording = false;
        this.currentRecordingId = null;
        Logger.setStatus(ErrorMessages.CALL_RECORDING_STOPPED);
        this.bus.emit("recording-changed", false);
      },
      error: (e: any) => {
        Logger.error(ErrorMessages.callRecordingStopFailed(attempt), e);
        if (attempt < 2) {
          Logger.setStatus(ErrorMessages.CALL_RECORDING_STOP_RETRYING);
          window.setTimeout(() => this.stopRecording(attempt + 1), this.recordingRetryDelayMs);
          return;
        }
        this.endCallOnRecordingFailure("stop failed after retry", e);
      }
    });
  }

  // =====================================
  // LEAVE
  // =====================================

  leave() {

    try {
      this.isLeaving = true;
      this.suppressRemoteFeedRetry = true;
      this.stopMediaStatsLoop();
      this.clearMixedAudioResources();
      this.vbManager.disable();
      this.vbEnabled = false;
      this.screenManager.stop();
      this.screenEnabled = false;
      this.clearRetryTimer();
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;

      if (this.recording && this.plugin) {
        try {
          this.plugin.send({ message: { request: "enable_recording", record: false, room: this.currentRoomId } });
        } catch (e: any) {
          Logger.error(ErrorMessages.CALL_RECORDING_STOP_ON_LEAVE_FAILED, e);
        }
      }

      try {
        if (this.joinedRoom) {
          this.plugin?.send({ message: { request: "leave" } });
        }
      } catch (e: any) {
        Logger.error(ErrorMessages.CALL_LEAVE_SIGNALING_FAILED, e);
      }

      this.remoteFeeds?.cleanupAll();
      this.remoteFeeds = null;

      this.plugin = null;
      this.suppressPublisherCleanupRetry = true;
      this.gateway.destroy();
      this.suppressPublisherCleanupRetry = false;
      this.stopParticipantSync();

      this.joinedRoom = false;
      this.recording = false;
      this.currentRecordingId = null;
      this.currentRoomId = null;
      this.activeJoinCfg = null;
      this.selfId = null;
      this.publisherPc = null;
      this.subscriberPcs.clear();
      this.peerTelemetryByFeed.clear();
      this.localVideoEnabled = true;
      this.videoToggleBusy = false;
      this.screenToggleBusy = false;
      this.vbToggleBusy = false;
      this.roster.reset();

      this.bus.emit("recording-changed", false);
      this.bus.emit("joined", false);
      this.bus.emit("video-mute-changed", false);
      this.connectionEngine.onLeft();

      this.media.clearLocal(this.localVideo);
      this.media.clearRemote(this.remoteVideo);
      this.cameraStream = null;
      this.cameraStreamOrientation = null;
      this.callId = null;

      Logger.setStatus(ErrorMessages.CALL_LEFT);

    } catch (e: any) {
      Logger.setStatus(ErrorMessages.callLeaveErrorStatus(e.message));
      Logger.error(ErrorMessages.CALL_LEAVE_ERROR, e);
    }
  }

  async toggleScreenShare() {
    if (!this.plugin || this.screenToggleBusy) return;
    this.screenToggleBusy = true;
    try {
      if (!this.screenEnabled) {
        const ss = await this.screenManager.start();
        const screenTrack = ss.getVideoTracks()[0];
        if (!screenTrack) throw new Error(ErrorMessages.CALL_SCREEN_VIDEO_TRACK_UNAVAILABLE);

        const cam = await this.ensureCameraStream();
        const micTrack = cam.getAudioTracks()[0] ?? null;
        const displayAudioTrack = ss.getAudioTracks()[0] ?? null;
        const outgoingAudio = await this.resolveScreenShareAudioTrack(micTrack, displayAudioTrack);
        if (outgoingAudio) this.syncPublishedAudioTrack(outgoingAudio);

        this.screenEnabled = true;
        await this.ensureOutgoingAudio({ camera: cam, screen: ss });
        this.replaceVideoTrack(screenTrack);
        Logger.setStatus(ErrorMessages.CALL_SCREEN_SHARE_STARTED);
        this.bus.emit("screen-changed", true);
        screenTrack.onended = () => {
          if (!this.isLeaving && this.screenEnabled) void this.toggleScreenShare();
        };
      } else {
        this.screenManager.stop();
        this.clearMixedAudioResources();
        this.screenEnabled = false;
        const cam = await this.ensureCameraStream();
        await this.ensureOutgoingAudio({ camera: cam });
        const videoTrack = cam.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = this.localVideoEnabled;
          this.replaceVideoTrack(videoTrack);
        }
        const micTrack = cam.getAudioTracks()[0];
        if (micTrack) this.syncPublishedAudioTrack(micTrack);
        Logger.setStatus(ErrorMessages.CALL_SCREEN_SHARE_STOPPED);
        this.bus.emit("screen-changed", false);
      }
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_SCREEN_SHARE_TOGGLE_FAILED, e);
      Logger.setStatus(MediaErrorUtils.getScreenShareErrorMessage(e));
    } finally {
      this.screenToggleBusy = false;
    }
  }

  async toggleVirtualBackground() {
    if (!this.plugin || this.vbToggleBusy) return;
    if (this.screenEnabled) {
      Logger.setStatus(ErrorMessages.CALL_DISABLE_SCREEN_BEFORE_VB);
      return;
    }
    this.vbToggleBusy = true;
    try {
      if (!this.vbEnabled) {
        if (!this.localVideoEnabled) {
          await this.setVideoEnabled(true);
        }
        const cam = await this.ensureCameraStream();
        const camVideoTrack = cam.getVideoTracks()[0];
        if (camVideoTrack) camVideoTrack.enabled = true;
        const processed = await this.vbManager.enable(cam);
        const track = processed.getVideoTracks()[0];
        if (!track) throw new Error(ErrorMessages.CALL_VB_OUTPUT_TRACK_UNAVAILABLE);
        track.enabled = true;
        this.vbEnabled = true;
        this.localVideoEnabled = true;
        this.replaceVideoTrack(track);
        this.guardVirtualBackgroundTrack(track, camVideoTrack ?? null);
        this.bus.emit("video-mute-changed", false);
        this.bus.emit("vb-changed", true);
      } else {
        this.vbManager.disable();
        this.vbEnabled = false;
        const cam = await this.ensureCameraStream();
        const track = cam.getVideoTracks()[0];
        if (track) {
          track.enabled = this.localVideoEnabled;
          this.replaceVideoTrack(track);
        }
        this.bus.emit("vb-changed", false);
      }
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_VB_TOGGLE_FAILED, e);
      Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
    } finally {
      this.vbToggleBusy = false;
    }
  }

  private async ensureCameraStream(): Promise<MediaStream> {
    try {
      const desiredOrientation = this.getViewportOrientation();
      const currentStream = this.cameraStream;
      const hasLiveVideo = !!currentStream?.getVideoTracks().some(t => t.readyState === "live");
      const hasLiveAudio = !!currentStream?.getAudioTracks().some(t => t.readyState === "live");
      const needsRecreate =
        !currentStream ||
        !hasLiveVideo ||
        !hasLiveAudio ||
        (this.isIOSDevice() && this.cameraStreamOrientation !== desiredOrientation);

      if (needsRecreate) {
        const videoConstraints = this.isIOSDevice()
          ? this.buildIOSVideoConstraints(desiredOrientation)
          : true;
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true
        });
        const previous = this.cameraStream;
        this.cameraStream = nextStream;
        this.cameraStreamOrientation = desiredOrientation;

        const nextAudio = nextStream.getAudioTracks()[0];
        if (nextAudio && (!this.screenEnabled || !this.mixedAudioTrack)) {
          this.syncPublishedAudioTrack(nextAudio);
        }

        if (previous && previous !== nextStream) {
          const vbSourceLive = !!this.vbManager
            .getSourceStream()
            ?.getVideoTracks()
            .some((t: MediaStreamTrack) => t.readyState === "live");
          previous.getTracks().forEach(t => {
            if (nextStream.getTracks().some(nt => nt.id === t.id)) return;
            if (this.vbEnabled && vbSourceLive && t.kind === "video") return;
            try {
              t.stop();
            } catch (stopErr: any) {
              Logger.error(ErrorMessages.CALL_STOP_STALE_CAMERA_TRACK_FAILED, stopErr);
            }
          });
        }
      }

      if (!this.cameraStream) {
        throw new Error(ErrorMessages.CALL_CAMERA_STREAM_UNAVAILABLE_AFTER_INIT);
      }
      return this.cameraStream;
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_CAMERA_ACCESS_FAILED, e);
      Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
      throw e;
    }
  }

  private guardVirtualBackgroundTrack(vbTrack: MediaStreamTrack, fallbackCameraTrack: MediaStreamTrack | null): void {
    window.setTimeout(() => {
      const recover = async () => {
        if (!this.vbEnabled) return;
        const vbTrackBroken = vbTrack.readyState !== "live" || vbTrack.muted === true;
        if (!vbTrackBroken) return;

        Logger.warn("Virtual background output track is not flowing. Falling back to camera.");
        this.vbManager.disable();
        this.vbEnabled = false;

        if (fallbackCameraTrack && fallbackCameraTrack.readyState === "live") {
          fallbackCameraTrack.enabled = this.localVideoEnabled;
          this.replaceVideoTrack(fallbackCameraTrack);
        } else {
          const activeCamera = await this.ensureCameraStream();
          const freshTrack = activeCamera.getVideoTracks()[0];
          if (freshTrack) {
            freshTrack.enabled = this.localVideoEnabled;
            this.replaceVideoTrack(freshTrack);
          }
        }
        this.bus.emit("vb-changed", false);
        Logger.setStatus(ErrorMessages.CALL_VB_FALLBACK_TO_CAMERA);
      };
      void recover().catch((e: any) => {
        Logger.error(ErrorMessages.CALL_VB_TOGGLE_FAILED, e);
      });
    }, 1500);
  }

  private replaceVideoTrack(track: MediaStreamTrack) {
    if (!this.plugin) return;
    try {
      this.plugin.replaceTracks({
        tracks: [{ type: "video", capture: track, recv: false }]
      });
      this.connectionEngine.onLocalTrackSignal(track, track.enabled !== false);
      this.media.setLocalTrack(this.localVideo, track);
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_REPLACE_VIDEO_TRACK_FAILED, e);
      Logger.setStatus(ErrorMessages.CALL_VIDEO_TRACK_SWITCH_FAILED);
    }
  }

  private getPreferredAudioTrack(): MediaStreamTrack | null {
    if (this.screenEnabled && this.mixedAudioTrack && this.mixedAudioTrack.readyState === "live") {
      return this.mixedAudioTrack;
    }
    const mic = this.cameraStream?.getAudioTracks().find((t: MediaStreamTrack) => t.readyState === "live") ?? null;
    return mic;
  }

  private syncPreferredAudioTrack(): void {
    if (!this.plugin) return;
    let preferred = this.getPreferredAudioTrack();
    if (!preferred && this.screenEnabled) {
      this.clearMixedAudioResources();
      preferred = this.getPreferredAudioTrack();
    }
    if (!preferred) return;
    preferred.enabled = true;
    this.syncPublishedAudioTrack(preferred);
  }

  private async ensureOutgoingAudio(opts?: { camera?: MediaStream | null; screen?: MediaStream | null }): Promise<void> {
    if (!this.plugin) return;
    const camera = opts?.camera ?? await this.ensureCameraStream();
    if (this.screenEnabled) {
      const screen = opts?.screen ?? this.screenManager.getStream();
      const micTrack = camera.getAudioTracks()[0] ?? null;
      const displayAudioTrack = screen?.getAudioTracks()[0] ?? null;
      const outgoing = await this.resolveScreenShareAudioTrack(micTrack, displayAudioTrack);
      if (outgoing) {
        outgoing.enabled = true;
        this.syncPublishedAudioTrack(outgoing);
      } else {
        Logger.warn("No outgoing audio track available during screen share.");
      }
      return;
    }

    if (this.mixedAudioTrack) {
      this.clearMixedAudioResources();
    }
    const micTrack = camera.getAudioTracks()[0] ?? null;
    if (micTrack) {
      micTrack.enabled = true;
      this.syncPublishedAudioTrack(micTrack);
    } else {
      Logger.warn("No microphone track available for outgoing audio.");
    }
  }

  private syncPublishedAudioTrack(track: MediaStreamTrack) {
    if (!this.plugin) return;
    try {
      this.plugin.replaceTracks({
        tracks: [{ type: "audio", capture: track, recv: false }]
      });
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_REPLACE_AUDIO_TRACK_FAILED, e);
    }
  }

  private async resolveScreenShareAudioTrack(
    micTrack: MediaStreamTrack | null,
    displayAudioTrack: MediaStreamTrack | null
  ): Promise<MediaStreamTrack | null> {
    this.clearMixedAudioResources();
    if (!micTrack && !displayAudioTrack) return null;
    if (!micTrack) return displayAudioTrack;
    if (!displayAudioTrack) return micTrack;

    try {
      const ctx = new AudioContext();
      const destination = ctx.createMediaStreamDestination();
      const micSource = ctx.createMediaStreamSource(new MediaStream([micTrack]));
      const displaySource = ctx.createMediaStreamSource(new MediaStream([displayAudioTrack]));
      micSource.connect(destination);
      displaySource.connect(destination);
      const mixedTrack = destination.stream.getAudioTracks()[0] ?? null;
      if (!mixedTrack) {
        void ctx.close();
        return micTrack;
      }
      this.mixedAudioContext = ctx;
      this.mixedAudioTrack = mixedTrack;
      return mixedTrack;
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_SCREEN_AUDIO_MIXING_FAILED, e);
      return micTrack;
    }
  }

  private clearMixedAudioResources() {
    if (this.mixedAudioTrack) {
      try {
        this.mixedAudioTrack.stop();
      } catch (e: any) {
        Logger.error(ErrorMessages.CALL_STOP_MIXED_AUDIO_TRACK_FAILED, e);
      }
    }
    this.mixedAudioTrack = null;
    if (this.mixedAudioContext) {
      this.mixedAudioContext.close().catch((e: any) => {
        Logger.error(ErrorMessages.CALL_CLOSE_MIXED_AUDIO_CONTEXT_FAILED, e);
      });
    }
    this.mixedAudioContext = null;
  }

  private startMediaStatsLoop() {
    this.monitoringStat.start();
  }

  private stopMediaStatsLoop() {
    this.monitoringStat.stop();
  }

  private pickFreshPeerTelemetry(now: number): PeerPlaybackTelemetry | null {
    for (const payload of this.peerTelemetryByFeed.values()) {
      if (now - payload.ts <= APP_CONFIG.mediaTelemetry.peerTelemetryFreshnessMs) {
        return payload;
      }
    }
    return null;
  }

  private sendPeerTelemetry(payload: PeerPlaybackTelemetry) {
    if (!APP_CONFIG.mediaTelemetry.enablePeerTelemetry) return;
    const channel = this.plugin?.data;
    if (typeof channel !== "function") return;
    try {
      channel.call(this.plugin, { text: JSON.stringify(payload) });
    } catch {}
  }
}


