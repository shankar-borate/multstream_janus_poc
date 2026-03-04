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
  private cameraStreamOrientation: "portrait" | "landscape" | null = null;
  private publisherPc: RTCPeerConnection | null = null;
  private subscriberPcs = new Map<number, RTCPeerConnection>();
  private localAudioEnabled = true;
  private localVideoEnabled = true;
  private audioToggleBusy = false;
  private videoToggleBusy = false;
  private screenToggleBusy = false;
  private vbToggleBusy = false;
  private monitoringStat: CallMonitoringStat;
  private peerTelemetryByFeed = new Map<number, PeerPlaybackTelemetry>();
  private peerNetworkTelemetryByFeed = new Map<number, PeerNetworkTelemetry>();
  private mixedAudioContext: AudioContext | null = null;
  private mixedAudioTrack: MediaStreamTrack | null = null;
  private callId: string | null = null;
  private readonly userType: "agent" | "customer" = this.resolveUserType();
  private adaptiveNetwork: AdaptiveNetworkManager;
  private cameraProfileKey = "";
  private suppressSessionDestroyedRetryUntil = 0;
  private lastPublisherTransportErrorReason: string | null = null;
  private lastPublisherTransportErrorAt = 0;
  private recordingController: RecordingController;

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
    this.adaptiveNetwork = new AdaptiveNetworkManager(this.userType, {
      onRiskSignal: (signal: NetworkRiskSignal) => {
        this.bus.emit("network-risk", signal);
      },
      onModeChanged: async (_mode: "normal" | "low", videoCfg: VcxVideoConfig) => {
        await this.applyAdaptiveVideoConfig(videoCfg);
      }
    });
    this.recordingController = new RecordingController({
      bus: this.bus,
      getPlugin: () => this.plugin,
      getJoinedRoom: () => this.joinedRoom,
      getCurrentRoomId: () => this.currentRoomId,
      getParticipantId: () => this.activeJoinCfg?.participantId,
      getServer: () => UrlConfig.getVcxServer(),
      isLeaving: () => this.isLeaving,
      leave: () => this.leave(),
      canRecord: () => this.userType === "agent"
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
        return !this.localAudioEnabled;
      },
      getPeerTelemetry: (now: number) => this.pickFreshPeerTelemetry(now),
      emitPeerTelemetry: (payload: PeerPlaybackTelemetry) => this.sendPeerTelemetry(payload),
      emitPeerNetworkTelemetry: (payload: PeerNetworkTelemetry) => this.sendPeerTelemetry(payload)
    });
  }

  private resolveUserType(): "agent" | "customer" {
    const qs = new URLSearchParams(window.location.search);
    const raw =
      qs.get("user_type") ??
      qs.get("usertpye") ??
      qs.get("usertype") ??
      "";
    return raw.trim().toLowerCase() === "agent" ? "agent" : "customer";
  }

  async join(cfg: JoinConfig, opts?: { internalRetry?: boolean }) {
    if (!opts?.internalRetry || !this.callId) {
      this.callId = Correlation.newId();
    }
    this.activeJoinCfg = cfg;
    this.isLeaving = false;
    this.localAudioEnabled = true;
    this.localVideoEnabled = true;
    this.suppressPublisherCleanupRetry = false;
    this.adaptiveNetwork.resetForJoin();
    this.lastPublisherTransportErrorReason = null;
    this.lastPublisherTransportErrorAt = 0;
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
      this.adaptiveNetwork.resetForJoin(payload);

      this.gateway.createSession(
        cfg.server,
        payload.PC_CONFIG?.iceServers,
        () => {
          this.connectionEngine.onSessionReady();
          this.attachAndEnsureRoomThenJoin(cfg);
        },
        () => {
          this.connectionEngine.onSessionDestroyed();
          if (this.isLeaving || Date.now() < this.suppressSessionDestroyedRetryUntil) {
            Logger.user("[call] Janus session destroyed after controlled teardown; retry skipped.");
            return;
          }
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

  private destroyGatewayControlled() {
    this.suppressSessionDestroyedRetryUntil = Date.now() + 5000;
    this.gateway.destroy();
  }

  private cleanupForRetry() {
    this.suppressRemoteFeedRetry = true;
    this.stopAdaptiveNetworkMonitor();
    this.stopMediaStatsLoop();
    this.clearMixedAudioResources();
    this.vbManager.disable();
    this.vbEnabled = false;
    this.screenManager.stop();
    this.screenEnabled = false;
    this.peerTelemetryByFeed.clear();
    this.peerNetworkTelemetryByFeed.clear();
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
    this.lastPublisherTransportErrorReason = null;
    this.lastPublisherTransportErrorAt = 0;
    this.localAudioEnabled = true;
    this.localVideoEnabled = true;
    this.audioToggleBusy = false;
    this.videoToggleBusy = false;
    this.screenToggleBusy = false;
    this.vbToggleBusy = false;
    this.currentRoomId = null;
    this.roster.reset();
    this.recordingController.reset();
    this.bus.emit("joined", false);
    this.bus.emit("mute-changed", false);

    this.suppressPublisherCleanupRetry = true;
    this.destroyGatewayControlled();
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
      this.logFinalFailure(kind, reason);
      this.connectionEngine.onFailed(reason);
      Logger.setStatus(ErrorMessages.callRetryLimitStatus(kind));
      Logger.error(ErrorMessages.callRetryExhausted(kind, this.callId ?? "n/a", cfg.roomId, reason));
      return;
    }

    if (kind === "server") {
      this.connectionEngine.onServerRetrying(attempt, maxAttempts, reason);
      Logger.setStatus(ErrorMessages.callServerRetrying(attempt, maxAttempts));
    } else {
      this.connectionEngine.onPeerRetrying(attempt, maxAttempts, reason);
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

        this.recordingController.reset();
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
        this.connectionEngine.onPeerRetrying(
          this.peerRetryAttempt + 1,
          APP_CONFIG.call.retry.peerMaxAttempts,
          "Publisher cleanup"
        );
        Logger.setStatus(ErrorMessages.CALL_PUBLISHER_CLEANUP_RECOVERING);
        this.schedulePeerRetry("Publisher cleanup");
      },
      (e: any) => {
        this.scheduleServerRetry(`Attach publisher failed: ${JSON.stringify(e)}`);
      },
      (payload: JanusSlowLinkEvent) => {
        this.bus.emit("janus-slowlink", {
          participantId: this.selfId,
          feedId: null,
          source: "publisher",
          direction: payload.uplink ? "uplink" : "downlink",
          lost: payload.lost,
          mid: payload.mid,
          at: Date.now()
        } as JanusSlowLinkSignal);
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
      Logger.user(`[transport-info] ${ErrorMessages.callPublisherHangup(reason)}`);
      if (this.isPeerTransportFailureText(reason)) {
        const failureReason = this.buildPeerFailureReason(`Publisher hangup: ${reason}`, this.publisherPc);
        this.rememberPublisherTransportError(failureReason);
        this.schedulePeerRetry(failureReason);
      }
      return;
    }

    const data = this.getVideoRoomData(msg);
    const event = data["videoroom"];
    const errorCode = data["error_code"];
    if (data?.error || errorCode) {
      Logger.user(`[transport-info] ${ErrorMessages.callPublisherPluginError(data)}`);
      if (!this.joinedRoom && this.handlePublisherJoinError(cfg, data, errorCode)) {
        return;
      }
      if (this.joinedRoom) {
        const runtimeIssue = this.classifyPublisherRuntimeIssue(data);
        if (runtimeIssue.kind === "peer") {
          this.rememberPublisherTransportError(runtimeIssue.reason);
          this.schedulePeerRetry(runtimeIssue.reason);
        } else {
          this.scheduleServerRetry(runtimeIssue.reason);
        }
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
          onRemoteNetworkTelemetry: (feedId: number, payload: PeerNetworkTelemetry) => {
            this.peerNetworkTelemetryByFeed.set(feedId, payload);
            this.bus.emit("peer-network-telemetry", { feedId, payload });
          },
          onSlowLink: (feedId: number, payload: JanusSlowLinkEvent) => {
            this.bus.emit("janus-slowlink", {
              participantId: feedId,
              feedId,
              source: "subscriber",
              direction: payload.uplink ? "uplink" : "downlink",
              lost: payload.lost,
              mid: payload.mid,
              at: Date.now()
            } as JanusSlowLinkSignal);
          },
          onRemoteFeedCleanup: (feedId: number) => {
            this.subscriberPcs.delete(feedId);
            this.peerTelemetryByFeed.delete(feedId);
            this.peerNetworkTelemetryByFeed.delete(feedId);
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
    const intervalMs = this.getParticipantSyncIntervalMs();
    this.participantSyncTimer = window.setInterval(() => {
      this.syncParticipantsFromServer(cfg);
    }, intervalMs);
  }

  private getParticipantSyncIntervalMs(): number {
    return this.adaptiveNetwork.getParticipantSyncIntervalMs();
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
    this.peerNetworkTelemetryByFeed.delete(feedId);
    this.remoteFeeds?.removeFeed(feedId);
    this.publishParticipants(cfg);
  }

  // =====================================
  // MEDIA
  // =====================================

  private getVideoConfig(): VcxVideoConfig {
    return this.adaptiveNetwork.getVideoConfig();
  }

  private getCurrentCameraProfileKey(): string {
    return this.adaptiveNetwork.getCameraProfileKey();
  }

  private buildVideoConstraintsForCurrentProfile(orientation: "portrait" | "landscape"): MediaTrackConstraints {
    return this.adaptiveNetwork.buildCameraConstraints(orientation, this.isIOSDevice());
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

  private startAdaptiveNetworkMonitor(pc: RTCPeerConnection | null) {
    this.adaptiveNetwork.start(pc);
  }

  private stopAdaptiveNetworkMonitor() {
    this.adaptiveNetwork.stop();
  }

  private async applyAdaptiveVideoConfig(videoCfg: VcxVideoConfig): Promise<void> {
    try {
      if (this.publisherPc) {
        this.tuneVideoSenderBitrate(this.publisherPc, videoCfg.bitrate_bps, videoCfg.max_framerate);
      }
      try {
        this.plugin?.send({
          message: {
            request: "configure",
            audio: this.localAudioEnabled,
            video: this.localVideoEnabled,
            bitrate: videoCfg.bitrate_bps,
            bitrate_cap: videoCfg.bitrate_cap
          }
        });
      } catch (e: any) {
        Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_ERROR, e);
      }

      if (this.activeJoinCfg && this.joinedRoom) {
        this.startParticipantSync(this.activeJoinCfg);
      }

      if (!this.screenEnabled && !this.vbEnabled && this.plugin) {
        const cam = await this.ensureCameraStream();
        const track = cam.getVideoTracks()[0];
        if (track) {
          track.enabled = this.localVideoEnabled;
          this.replaceVideoTrack(track);
        }
      }
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
        this.startAdaptiveNetworkMonitor(pc);
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

        (pc as any).onicecandidateerror = (evt: RTCPeerConnectionIceErrorEvent) => {
          const parsed = this.parseIceCandidateError(evt);
          this.rememberPublisherTransportError(parsed.reason, false, evt);
        };

        pc.oniceconnectionstatechange = () => {
          console.log("VCX_ICE=" + pc.iceConnectionState);
          emit();
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            this.lastPublisherTransportErrorReason = null;
            this.lastPublisherTransportErrorAt = 0;
            return;
          }
          if (pc.iceConnectionState === "failed") {
            const reason = this.buildPeerFailureReason("Publisher ICE state failed", pc);
            this.rememberPublisherTransportError(reason);
            this.schedulePeerRetry(reason);
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
          const connectionState = String((pc as any).connectionState ?? "");
          if (connectionState === "connected") {
            this.lastPublisherTransportErrorReason = null;
            this.lastPublisherTransportErrorAt = 0;
            return;
          }
          if (connectionState === "failed") {
            const dtlsHint = this.inferDtlsFailureHint(pc);
            const trigger = dtlsHint
              ? `Publisher connection state failed (${dtlsHint})`
              : "Publisher connection state failed";
            const reason = this.buildPeerFailureReason(trigger, pc);
            this.rememberPublisherTransportError(reason);
            this.schedulePeerRetry(reason);
          }
        };

        pc.onicegatheringstatechange = () => {
          console.log("VCX_GATHERING=" + pc.iceGatheringState);
          emit();
        };
      } else {
        this.publisherPc = null;
        this.lastPublisherTransportErrorReason = null;
        this.lastPublisherTransportErrorAt = 0;
        this.stopAdaptiveNetworkMonitor();
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

  private normalizeFailureReason(reason: string): string {
    const normalized = String(reason || "").replace(/\s+/g, " ").trim();
    if (!normalized) return "unknown failure";
    const maxLen = 240;
    if (normalized.length <= maxLen) return normalized;
    return `${normalized.slice(0, maxLen - 3)}...`;
  }

  private rememberPublisherTransportError(reason: string, severe: boolean = false, rawErr?: unknown) {
    const normalized = this.normalizeFailureReason(reason);
    this.lastPublisherTransportErrorReason = normalized;
    this.lastPublisherTransportErrorAt = Date.now();
    const tag = severe ? "VCX_TRANSPORT_ERROR" : "VCX_TRANSPORT_INFO";
    const tagStyle = severe
      ? "background:#991b1b;color:#ffffff;padding:2px 6px;font-weight:700;border-radius:3px"
      : "background:#1d4ed8;color:#ffffff;padding:2px 6px;font-weight:700;border-radius:3px";
    console.log(`%c${tag}%c ${normalized}`, tagStyle, "color:#111827;font-weight:600");
    if (rawErr) {
      if (severe) {
        console.error(rawErr);
      } else {
        console.log(rawErr);
      }
    }
    if (severe) {
      Logger.error(normalized);
    } else {
      Logger.user(`[transport-info] ${normalized}`);
    }
  }

  private getRecentPublisherTransportHint(): string | null {
    if (!this.lastPublisherTransportErrorReason) return null;
    const ageMs = Date.now() - this.lastPublisherTransportErrorAt;
    if (ageMs > 30000) return null;
    return this.lastPublisherTransportErrorReason;
  }

  private inferDtlsFailureHint(pc: RTCPeerConnection): string | null {
    const sctpTransportState = String((pc as any)?.sctp?.transport?.state || "").toLowerCase();
    if (sctpTransportState === "failed") {
      return "DTLS transport failed";
    }

    const senderTransportState = pc.getSenders()
      .map((s: RTCRtpSender) => String((s as any)?.transport?.state || "").toLowerCase())
      .find((state: string) => state.length > 0);
    if (senderTransportState === "failed") {
      return "DTLS sender transport failed";
    }

    const receiverTransportState = pc.getReceivers()
      .map((r: RTCRtpReceiver) => String((r as any)?.transport?.state || "").toLowerCase())
      .find((state: string) => state.length > 0);
    if (receiverTransportState === "failed") {
      return "DTLS receiver transport failed";
    }

    const connectionState = String((pc as any).connectionState ?? "");
    if (
      connectionState === "failed" &&
      (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed")
    ) {
      return "DTLS/SRTP likely failed after ICE connected";
    }

    return null;
  }

  private buildPeerFailureReason(trigger: string, pc: RTCPeerConnection | null): string {
    const parts: string[] = [this.normalizeFailureReason(trigger)];
    if (!navigator.onLine) {
      parts.push("browser offline");
    }
    if (pc) {
      const connectionState = String((pc as any).connectionState ?? "n/a");
      parts.push(`ice=${pc.iceConnectionState}, connection=${connectionState}, signaling=${pc.signalingState}`);
      const dtlsHint = this.inferDtlsFailureHint(pc);
      if (dtlsHint) {
        parts.push(dtlsHint);
      }
    }
    const transportHint = this.getRecentPublisherTransportHint();
    if (transportHint && !trigger.includes(transportHint) && !trigger.includes("hint=")) {
      parts.push(`hint=${transportHint}`);
    }
    return this.normalizeFailureReason(parts.join(" | "));
  }

  private logFinalFailure(kind: "server" | "peer", reason: string) {
    const normalized = this.normalizeFailureReason(reason);
    const tag = kind === "peer" ? "VCX_TRANSPORT_FINAL_ERROR" : "VCX_SERVER_FINAL_ERROR";
    const tagStyle = "background:#7f1d1d;color:#ffffff;padding:2px 6px;font-weight:700;border-radius:3px";
    console.log(`%c${tag}%c ${normalized}`, tagStyle, "color:#111827;font-weight:600");
  }

  private parseIceCandidateError(evt: RTCPeerConnectionIceErrorEvent): { reason: string; severe: boolean } {
    const anyEvt = evt as any;
    const url = String(anyEvt?.url || "unknown");
    const lowerUrl = url.toLowerCase();
    const isTurn = lowerUrl.startsWith("turn:") || lowerUrl.startsWith("turns:");
    const codeRaw = Number(anyEvt?.errorCode);
    const code = Number.isFinite(codeRaw) ? codeRaw : NaN;
    const text = String(anyEvt?.errorText || "").trim();
    const lowerText = text.toLowerCase();

    let label = isTurn ? "TURN candidate negotiation error" : "ICE candidate negotiation error";
    let severe = false;

    if (code === 401 || code === 438 || lowerText.includes("unauth") || lowerText.includes("credential")) {
      label = "TURN authentication failed";
      severe = true;
    } else if (lowerUrl.startsWith("turns:") || lowerText.includes("tls")) {
      label = "TURN TLS connection failed";
      severe = true;
    } else if (lowerText.includes("dtls")) {
      label = "DTLS handshake failed";
      severe = true;
    } else if (
      code === 701 ||
      lowerText.includes("unreachable") ||
      lowerText.includes("timed out") ||
      lowerText.includes("timeout") ||
      lowerText.includes("host lookup")
    ) {
      label = isTurn ? "TURN server unreachable" : "STUN/ICE server unreachable";
      severe = true;
    }

    const codeText = Number.isFinite(code) ? String(code) : "n/a";
    const detailText = text || "n/a";
    return {
      reason: this.normalizeFailureReason(`${label} (url=${url}, code=${codeText}, text=${detailText})`),
      severe
    };
  }

  private isPeerTransportFailureText(reason: string): boolean {
    const lower = reason.toLowerCase();
    return lower.includes("ice") ||
      lower.includes("turn") ||
      lower.includes("dtls") ||
      lower.includes("tls") ||
      lower.includes("webrtc") ||
      lower.includes("peer") ||
      lower.includes("srtp");
  }

  private classifyPublisherRuntimeIssue(data: any): { kind: "peer" | "server"; reason: string } {
    const errorCodeRaw = Number(data?.error_code);
    const errorCode = Number.isFinite(errorCodeRaw) ? String(errorCodeRaw) : "n/a";
    const detail = this.normalizeFailureReason(JoinErrorUtils.extractErrorText(data) || JSON.stringify(data));
    if (this.isPeerTransportFailureText(detail)) {
      return {
        kind: "peer",
        reason: this.normalizeFailureReason(`Publisher runtime media error code=${errorCode} detail=${detail}`)
      };
    }
    return {
      kind: "server",
      reason: this.normalizeFailureReason(`Publisher runtime signaling error code=${errorCode} detail=${detail}`)
    };
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
    this.connectionEngine.onPeerRetrying(
      this.peerRetryAttempt + 1,
      APP_CONFIG.call.retry.peerMaxAttempts,
      ErrorMessages.callOfferErrorReason(e)
    );
    Logger.setStatus(ErrorMessages.CALL_OFFER_ERROR_RECOVERING);
    this.schedulePeerRetry(ErrorMessages.callOfferErrorReason(e));
  }

  toggleMute() {
    void this.setAudioEnabled(!this.localAudioEnabled);
  }

  async setAudioEnabled(enabled: boolean): Promise<boolean> {
    if (!this.plugin) return this.localAudioEnabled;
    if (this.audioToggleBusy) return this.localAudioEnabled;
    this.audioToggleBusy = true;
    try {
      const track = this.getPreferredAudioTrack();
      if (enabled) {
        if (track) track.enabled = true;
        try {
          if (typeof this.plugin.unmuteAudio === "function") {
            this.plugin.unmuteAudio();
          } else {
            this.plugin.send({ message: { request: "configure", audio: true } });
          }
        } catch (e: any) {
          Logger.error(ErrorMessages.CALL_AUDIO_UNMUTE_SIGNALING_FAILED, e);
        }
        this.localAudioEnabled = true;
      } else {
        if (track) track.enabled = false;
        try {
          if (typeof this.plugin.muteAudio === "function") {
            this.plugin.muteAudio();
          } else {
            this.plugin.send({ message: { request: "configure", audio: false } });
          }
        } catch (e: any) {
          Logger.error(ErrorMessages.CALL_AUDIO_MUTE_SIGNALING_FAILED, e);
        }
        this.localAudioEnabled = false;
      }
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_AUDIO_TOGGLE_FAILED, e);
      Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
    } finally {
      this.audioToggleBusy = false;
      this.bus.emit("mute-changed", !this.localAudioEnabled);
    }
    return this.localAudioEnabled;
  }

  async setVideoEnabled(enabled: boolean): Promise<boolean> {
    if (!this.plugin) return this.localVideoEnabled;
    if (this.videoToggleBusy) return this.localVideoEnabled;
    this.videoToggleBusy = true;
    try {
      const activeVideoTrack = this.screenEnabled
        ? this.screenManager.getStream()?.getVideoTracks()[0]
        : this.vbEnabled
          ? this.vbManager.getOutputStream()?.getVideoTracks()[0]
          : this.cameraStream?.getVideoTracks()[0];

      if (enabled) {
        let track = activeVideoTrack;
        if (!track) {
          const cam = await this.ensureCameraStream();
          track = this.vbEnabled
            ? this.vbManager.getOutputStream()?.getVideoTracks()[0] ?? cam.getVideoTracks()[0]
            : cam.getVideoTracks()[0];
          if (this.vbEnabled) {
            const vbSourceTrack = this.vbManager.getSourceStream()?.getVideoTracks()[0] ?? cam.getVideoTracks()[0];
            if (vbSourceTrack) vbSourceTrack.enabled = true;
          }
        }
        if (track) {
          track.enabled = true;
          this.connectionEngine.onLocalTrackSignal(track, true);
          this.media.setLocalTrack(this.localVideo, track);
        }
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
        if (activeVideoTrack) {
          activeVideoTrack.enabled = false;
          this.connectionEngine.onLocalTrackSignal(activeVideoTrack, false);
          this.media.setLocalTrack(this.localVideo, activeVideoTrack);
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

  public getParticipantNetworkPeers(): ParticipantNetworkPeers {
    return {
      selfId: this.selfId,
      publisher: this.publisherPc,
      subscribers: Array.from(this.subscriberPcs.entries()).map(([feedId, pc]) => ({ feedId, pc }))
    };
  }

  stopVideo() {
    void this.setVideoEnabled(false);
  }

  // =====================================
  // RECORDING
  // =====================================

  public setRecordingMeetingContext(groupId: number, meetingId: number) {
    this.recordingController.setMeetingContext(groupId, meetingId);
  }

  public clearRecordingMeetingContext() {
    this.recordingController.clearMeetingContext();
  }

  public async startRecording(source: "manual" | "auto", renderedParticipantCount: number) {
    await this.recordingController.start(source, renderedParticipantCount);
  }

  public stopRecording(source: "manual" | "auto") {
    this.recordingController.stop(source);
  }

  // =====================================
  // LEAVE
  // =====================================

  leave() {

    try {
      this.isLeaving = true;
      this.suppressRemoteFeedRetry = true;
      this.stopAdaptiveNetworkMonitor();
      this.stopMediaStatsLoop();
      this.clearMixedAudioResources();
      this.vbManager.disable();
      this.vbEnabled = false;
      this.screenManager.stop();
      this.screenEnabled = false;
      this.clearRetryTimer();
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;

      this.recordingController.stopOnLeave();

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
      this.destroyGatewayControlled();
      this.suppressPublisherCleanupRetry = false;
      this.stopParticipantSync();

      this.joinedRoom = false;
      this.currentRoomId = null;
      this.activeJoinCfg = null;
      this.selfId = null;
      this.publisherPc = null;
      this.subscriberPcs.clear();
      this.lastPublisherTransportErrorReason = null;
      this.lastPublisherTransportErrorAt = 0;
      this.peerTelemetryByFeed.clear();
      this.peerNetworkTelemetryByFeed.clear();
      this.localAudioEnabled = true;
      this.localVideoEnabled = true;
      this.audioToggleBusy = false;
      this.videoToggleBusy = false;
      this.screenToggleBusy = false;
      this.vbToggleBusy = false;
      this.roster.reset();

      this.bus.emit("recording-changed", false);
      this.bus.emit("joined", false);
      this.bus.emit("mute-changed", false);
      this.bus.emit("video-mute-changed", false);
      this.connectionEngine.onLeft();

      this.media.clearLocal(this.localVideo);
      this.media.clearRemote(this.remoteVideo);
      this.cameraStream = null;
      this.cameraStreamOrientation = null;
      this.cameraProfileKey = "";
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
      const desiredProfileKey = this.getCurrentCameraProfileKey();
      const currentStream = this.cameraStream;
      const hasLiveVideo = !!currentStream?.getVideoTracks().some(t => t.readyState === "live");
      const hasLiveAudio = !!currentStream?.getAudioTracks().some(t => t.readyState === "live");
      const needsRecreate =
        !currentStream ||
        !hasLiveVideo ||
        !hasLiveAudio ||
        (this.isIOSDevice() && this.cameraStreamOrientation !== desiredOrientation) ||
        this.cameraProfileKey !== desiredProfileKey;

      if (needsRecreate) {
        const videoConstraints = this.buildVideoConstraintsForCurrentProfile(desiredOrientation);
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true
        });
        const previous = this.cameraStream;
        this.cameraStream = nextStream;
        this.cameraStreamOrientation = desiredOrientation;
        this.cameraProfileKey = desiredProfileKey;

        const nextAudio = nextStream.getAudioTracks()[0];
        if (nextAudio && (!this.screenEnabled || !this.mixedAudioTrack)) {
          nextAudio.enabled = this.localAudioEnabled;
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
      if (!this.cameraProfileKey) {
        this.cameraProfileKey = desiredProfileKey;
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
    preferred.enabled = this.localAudioEnabled;
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
        outgoing.enabled = this.localAudioEnabled;
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
      micTrack.enabled = this.localAudioEnabled;
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
    let latest: PeerPlaybackTelemetry | null = null;
    for (const payload of this.peerTelemetryByFeed.values()) {
      if (now - payload.ts <= APP_CONFIG.mediaTelemetry.peerTelemetryFreshnessMs) {
        if (!latest || payload.ts > latest.ts) {
          latest = payload;
        }
      }
    }
    return latest;
  }

  private sendPeerTelemetry(payload: PeerPlaybackTelemetry | PeerNetworkTelemetry) {
    if (!APP_CONFIG.mediaTelemetry.enablePeerTelemetry) return;
    const channel = this.plugin?.data;
    if (typeof channel !== "function") return;
    try {
      channel.call(this.plugin, { text: JSON.stringify(payload) });
    } catch {}
  }
}


