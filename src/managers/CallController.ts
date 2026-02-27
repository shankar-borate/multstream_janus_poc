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

  // ✅ CLEAN recording state
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
  private callId: string | null = null;

  constructor(
    private bus: EventBus,
    private localVideo: HTMLVideoElement,
    private remoteVideo: HTMLVideoElement
  ) {
    this.gateway = new JanusGateway();
    this.media = new MediaManager();
    this.vbManager = new VirtualBackgroundManager();
    this.connectionEngine = new ConnectionStatusEngine((status: ConnectionStatusView) => {
      this.bus.emit("connection-status", status);
    });
    this.bus.emit("connection-status", this.connectionEngine.getStatus());
    this.gateway.init();
  }

  async join(cfg: JoinConfig, opts?: { internalRetry?: boolean }) {
    if (!opts?.internalRetry || !this.callId) {
      this.callId = Correlation.newId();
    }
    this.activeJoinCfg = cfg;
    this.isLeaving = false;
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
      Logger.error(`[join] failed callId=${this.callId} roomId=${cfg.roomId} requestId=${requestId}`, e);
      this.scheduleServerRetry("Join error: " + (e?.message || e));
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
      if (kind === "server") {
        Logger.setStatus("Video server call failed. Retry limit reached.");
      } else {
        Logger.setStatus("TURN/peer connection failed. Retry limit reached.");
      }
      Logger.error(`[retry] ${kind} retries exhausted. callId=${this.callId ?? "n/a"} roomId=${cfg.roomId} reason=${reason}`);
      return;
    }

    if (kind === "server") {
      this.connectionEngine.onServerRetrying(attempt, maxAttempts);
      Logger.setStatus(`Video server call failed. Retrying (${attempt}/${maxAttempts})...`);
    } else {
      this.connectionEngine.onPeerRetrying(attempt, maxAttempts);
      Logger.setStatus(`TURN/peer connection failed. Retrying (${attempt}/${maxAttempts})...`);
    }
    Logger.warn(`[retry] ${kind} scheduled (${attempt}/${maxAttempts}). callId=${this.callId ?? "n/a"} roomId=${cfg.roomId} reason=${reason}`);

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

        Logger.setStatus("Plugin attached. Checking room...");
        this.ensureRoomThenJoin(cfg);
      },
      (msg: any, jsep: any) => this.onPublisherMessage(cfg, msg, jsep),
      (track: any, on: any) => {
        if (track && typeof track.kind === "string") {
          this.connectionEngine.onLocalTrackSignal(track, !!on);
        }
        if (on && track.kind === "video") {
          this.media.setLocalTrack(this.localVideo, track);
        }
      },
      () => {
        if (this.isLeaving || this.suppressPublisherCleanupRetry) return;
        this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
        Logger.setStatus("Publisher cleanup. Recovering media connection...");
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
          Logger.setStatus(`Room exists. Joining...`);
          this.sendPublisherJoin(cfg);
        } else {
          Logger.setStatus(`Room not found. Creating...`);
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
        description: `Room ${cfg.roomId}`
      },
      success: () => {
        Logger.setStatus("Room created. Joining...");
        this.sendPublisherJoin(cfg);
      },
      error: () => {
        this.scheduleServerRetry("Create room failed");
      }
    });
  }

  private isParticipantIdCollisionError(errorCode: number | null, errorText: string): boolean {
    const lower = errorText.toLowerCase();
    if (errorCode === 436) return true;
    return lower.includes("id") &&
      (lower.includes("exists") || lower.includes("exist") || lower.includes("already") || lower.includes("taken"));
  }

  private handlePublisherJoinError(cfg: JoinConfig, data: any, errorCodeRaw: unknown): boolean {
    const errorCode = Number.isFinite(Number(errorCodeRaw)) ? Number(errorCodeRaw) : null;
    const errorText = String(data?.error || data?.error_reason || data?.reason || "").trim();
    const lower = errorText.toLowerCase();

    if (errorCode === 426) {
      if (!this.roomCreateAttempted) {
        this.roomCreateAttempted = true;
        this.sendCreateRoom(cfg);
      } else {
        this.scheduleServerRetry("Room join failed with 426 after create attempt");
      }
      return true;
    }

    if (this.isParticipantIdCollisionError(errorCode, errorText)) {
      const msg = "Participant ID already in use. Use a unique Participant ID and reconnect.";
      Logger.error(`[join] participant id collision callId=${this.callId ?? "n/a"} roomId=${cfg.roomId} participantId=${cfg.participantId ?? "n/a"} code=${errorCode ?? "n/a"} detail=${errorText}`);
      Logger.setStatus(msg);
      this.connectionEngine.setFatalError(msg, "Open call with a unique participant ID.");
      this.bus.emit("joined", false);
      return true;
    }

    const unauthorized = lower.includes("unauthor") || lower.includes("forbidden") || errorCode === 433 || errorCode === 428;
    if (unauthorized) {
      const msg = "Authorization failed for call join. Please refresh and re-authenticate.";
      Logger.error(`[join] unauthorized callId=${this.callId ?? "n/a"} roomId=${cfg.roomId} code=${errorCode ?? "n/a"} detail=${errorText}`);
      Logger.setStatus(msg);
      this.connectionEngine.setFatalError(msg, "Retry after authentication.");
      this.bus.emit("joined", false);
      return true;
    }

    const roomMissing = lower.includes("no such room") || lower.includes("room not found");
    if (roomMissing) {
      if (!this.roomCreateAttempted) {
        this.roomCreateAttempted = true;
        this.sendCreateRoom(cfg);
      } else {
        this.scheduleServerRetry(`Room missing after create attempt (code=${errorCode ?? "n/a"})`);
      }
      return true;
    }

    this.scheduleServerRetry(`Publisher join error code=${errorCode ?? "n/a"} detail=${errorText || JSON.stringify(data)}`);
    return true;
  }

  private onPublisherMessage(cfg: JoinConfig, msg: any, jsep: any) {
    if (msg?.janus === "hangup") {
      const reason = String(msg?.reason || "Peer hangup");
      Logger.error(`Publisher hangup: ${reason}`);
      if (reason.toLowerCase().includes("ice")) {
        this.schedulePeerRetry(`Publisher hangup: ${reason}`);
      }
      return;
    }

    const data = this.getVideoRoomData(msg);
    const event = data["videoroom"];
    const errorCode = data["error_code"];
    if (data?.error || errorCode) {
      Logger.error(`Publisher plugin error: ${JSON.stringify(data)}`);
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

      Logger.setStatus("Joined. Publishing...");

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
          onRemoteFeedCleanup: (feedId: number) => {
            this.subscriberPcs.delete(feedId);
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
            Logger.setStatus("Remote video is unstable. Ask participant to reconnect.");
            Logger.error(`[remote-feed] retry exhausted callId=${this.callId ?? "n/a"} roomId=${cfg.roomId} feedId=${feedId} attempts=${attempts}`);
          }
        }
      );

      this.publish();
      this.reconcile(cfg, data["publishers"]);
      this.bus.emit("joined", true);
      this.startParticipantSync(cfg);
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
      Logger.error(`listparticipants timeout (request=${requestSeq}, room=${cfg.roomId})`);
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
        Logger.error(`listparticipants error (request=${requestSeq}): ${JSON.stringify(e)}`);
      }
    });
  }

  private removeParticipant(cfg: JoinConfig, feedId: number) {
    if (feedId === this.selfId) return;
    this.roster.remove(feedId);
    this.subscriberPcs.delete(feedId);
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
        Logger.error("VCX_SET_PARAMETERS_ERROR", e);
      });
    } catch (e: any) {
      Logger.error("VCX_SET_PARAMETERS_HOOK_ERROR", e);
    }
  }

  private getErrorName(err: any): string {
    return String(err?.name || err?.error?.name || "").trim();
  }

  private getErrorMessage(err: any): string {
    return String(err?.message || err?.error?.message || "").trim();
  }

  private isMediaPermissionError(err: any): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "notallowederror" ||
      name === "permissiondeniederror" ||
      name === "securityerror" ||
      /permission|denied|not allowed/.test(msg);
  }

  private isMediaDeviceMissingError(err: any): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "notfounderror" ||
      name === "devicesnotfounderror" ||
      /requested device not found|notfound/.test(msg);
  }

  private isMediaBusyError(err: any): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "notreadableerror" ||
      name === "trackstarterror" ||
      /device in use|device is busy|could not start video source/.test(msg);
  }

  private isMediaConstraintError(err: any): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "overconstrainederror" ||
      name === "constraintnotsatisfiederror" ||
      /overconstrained|constraint/.test(msg);
  }

  private getCameraMicErrorMessage(err: any): string {
    if (this.isMediaPermissionError(err)) {
      return "Camera/Mic access blocked. Allow permissions in browser settings, then retry.";
    }
    if (this.isMediaDeviceMissingError(err)) {
      return "Camera or microphone not found. Connect your devices, then retry.";
    }
    if (this.isMediaBusyError(err)) {
      return "Camera/Mic is busy in another app. Close other apps using them, then retry.";
    }
    if (this.isMediaConstraintError(err)) {
      return "Camera/Mic settings are unsupported. Reconnect device or reset browser media settings.";
    }
    return "Unable to start camera/microphone. Check devices and browser permissions, then retry.";
  }

  private getScreenShareErrorMessage(err: any): string {
    if (this.isMediaPermissionError(err)) {
      return "Screen share was blocked or canceled. Select a window/screen and allow access.";
    }
    if (this.getErrorName(err).toLowerCase() === "aborterror") {
      return "Screen share was canceled. Please try sharing again.";
    }
    if (this.isMediaBusyError(err)) {
      return "Screen share is unavailable right now. Close blocking apps and retry.";
    }
    return "Screen share failed. Please try again.";
  }

  private classifyPublishError(err: any): { userMessage: string; retryable: boolean } {
    if (this.isMediaPermissionError(err) || this.isMediaDeviceMissingError(err) || this.isMediaBusyError(err) || this.isMediaConstraintError(err)) {
      return {
        userMessage: this.getCameraMicErrorMessage(err),
        retryable: false
      };
    }

    return {
      userMessage: "Offer error. Recovering media path...",
      retryable: true
    };
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
      throw new Error("Camera or microphone track unavailable");
    }

    // Ensure local preview and connectivity state are updated even when
    // browser/Janus onlocaltrack callback is delayed or missing.
    this.connectionEngine.onLocalTrackSignal(videoTrack, true);
    this.media.setLocalTrack(this.localVideo, videoTrack);

    return [
      { type: "audio", capture: audioTrack, recv: false },
      { type: "video", capture: videoTrack, recv: false }
    ];
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
      Logger.setStatus("Publish ignored: plugin not ready");
      return;
    }
    const videoCfg = this.getVideoConfig();
    let tracks: any[];

    try {
      tracks = await this.getPublishTracks();
    } catch (e: any) {
      const classified = this.classifyPublishError(e);
      Logger.setStatus(classified.userMessage);
      Logger.error(classified.userMessage, e);
      this.connectionEngine.setFatalError(
        classified.userMessage,
        "Fix camera/mic issue and reconnect the call."
      );
      return;
    }

    this.plugin.createOffer({
      tracks,

      success: (jsep: any) => {
        // ✅ Point #4: capture and emit connectivity info from RTCPeerConnection
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
          Logger.error("VCX_CONNECTIVITY hook error", e);
        }

        // ✅ normal Janus publish configure
        this.plugin.send({
          message: {
            request: "configure",
            audio: true,
            video: true,
            bitrate: videoCfg.bitrate_bps,
            bitrate_cap: videoCfg.bitrate_cap
          },
          jsep,
        });
      },

      error: (e: any) => {
        const classified = this.classifyPublishError(e);
        console.error("VCX_OFFER_ERROR", e);
        Logger.setStatus(classified.userMessage);
        Logger.error(classified.userMessage, e);
        if (!classified.retryable) {
          this.connectionEngine.setFatalError(
            classified.userMessage,
            "Fix camera/mic issue and reconnect the call."
          );
          return;
        }
        this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
        Logger.setStatus("Offer error. Recovering media path...");
        this.schedulePeerRetry("Offer error: " + JSON.stringify(e));
      },
    });
  }

  toggleMute() {
    if (!this.plugin) return;
    const m = this.plugin.isAudioMuted();
    m ? this.plugin.unmuteAudio() : this.plugin.muteAudio();
    this.bus.emit("mute-changed", !m);
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
    this.plugin?.send({ message: { request: "unpublish" } });
  }

  // =====================================
  // RECORDING
  // =====================================

  private endCallOnRecordingFailure(message: string, err?: unknown) {
    Logger.error(`[recording] ${message}`, err);
    Logger.setStatus("Recording failed twice. Ending call.");
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
        Logger.setStatus(`Recording started (room): ${recordingId}`);
        this.bus.emit("recording-changed", true);
      },
      error: (e: any) => {
        Logger.error(`[recording] start failed (attempt ${attempt})`, e);
        this.recording = false;
        this.bus.emit("recording-changed", false);
        if (attempt < 2) {
          Logger.setStatus("Recording start failed. Retrying...");
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
        Logger.setStatus("Recording stopped");
        this.bus.emit("recording-changed", false);
      },
      error: (e: any) => {
        Logger.error(`[recording] stop failed (attempt ${attempt})`, e);
        if (attempt < 2) {
          Logger.setStatus("Recording stop failed. Retrying...");
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
      this.clearRetryTimer();
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;

      if (this.recording && this.plugin) {
        try {
          this.plugin.send({ message: { request: "enable_recording", record: false, room: this.currentRoomId } });
        } catch (e: any) {
          Logger.error("[recording] stop on leave failed", e);
        }
      }

      try {
        if (this.joinedRoom) {
          this.plugin?.send({ message: { request: "leave" } });
        }
      } catch (e: any) {
        Logger.error("Leave signaling failed", e);
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
      this.roster.reset();

      this.bus.emit("recording-changed", false);
      this.bus.emit("joined", false);
      this.connectionEngine.onLeft();

      this.media.clearLocal(this.localVideo);
      this.media.clearRemote(this.remoteVideo);
      this.cameraStream = null;
      this.cameraStreamOrientation = null;
      this.callId = null;

      Logger.setStatus("Left");

    } catch (e: any) {
      Logger.setStatus("Leave error: " + e.message);
      Logger.error("Leave error", e);
    }
  }

    async toggleScreenShare(){
    if(!this.plugin) return;
    try {
      if(!this.screenEnabled){
        const ss = await this.screenManager.start();
        const track = ss.getVideoTracks()[0];
        if(!track) return;
        this.screenEnabled = true;
        this.replaceVideoTrack(track);
        Logger.setStatus("Screen share started");
        this.bus.emit("screen-changed", true);
        track.onended = ()=>{ if(this.screenEnabled) void this.toggleScreenShare(); };
      } else {
        this.screenManager.stop();
        this.screenEnabled = false;
        const cam = await this.ensureCameraStream();
        const track = cam.getVideoTracks()[0];
        if(track) this.replaceVideoTrack(track);
        Logger.setStatus("Screen share stopped");
        this.bus.emit("screen-changed", false);
      }
    } catch (e: any) {
      Logger.error("Screen share toggle failed", e);
      Logger.setStatus(this.getScreenShareErrorMessage(e));
    }
  }

  async toggleVirtualBackground(){
    if(!this.plugin) return;
    if(this.screenEnabled){
      Logger.setStatus("Disable screen share before virtual background");
      return;
    }
    try {
      if(!this.vbEnabled){
        const cam = await this.ensureCameraStream();
        const processed = await this.vbManager.enable(cam);
        const track = processed.getVideoTracks()[0];
        if(!track) return;
        this.vbEnabled = true;
        this.replaceVideoTrack(track);
        this.bus.emit("vb-changed", true);
      } else {
        this.vbManager.disable();
        this.vbEnabled = false;
        const cam = await this.ensureCameraStream();
        const track = cam.getVideoTracks()[0];
        if(track) this.replaceVideoTrack(track);
        this.bus.emit("vb-changed", false);
      }
    } catch (e: any) {
      Logger.error("Virtual background toggle failed", e);
      Logger.setStatus(this.getCameraMicErrorMessage(e));
    }
  }
  private async ensureCameraStream(): Promise<MediaStream>{
    try {
      const desiredOrientation = this.getViewportOrientation();
      const hasLiveVideo = !!this.cameraStream?.getVideoTracks().some(t => t.readyState === "live");
      const hasLiveAudio = !!this.cameraStream?.getAudioTracks().some(t => t.readyState === "live");
      const needsRecreate =
        !this.cameraStream ||
        !hasLiveVideo ||
        !hasLiveAudio ||
        (this.isIOSDevice() && this.cameraStreamOrientation !== desiredOrientation);

      if (needsRecreate) {
        if (this.cameraStream) {
          this.cameraStream.getTracks().forEach(t => {
            try {
              t.stop();
            } catch (stopErr: any) {
              Logger.error("Stopping stale camera track failed", stopErr);
            }
          });
        }

        const videoConstraints = this.isIOSDevice()
          ? this.buildIOSVideoConstraints(desiredOrientation)
          : true;

        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true
        });
        this.cameraStreamOrientation = desiredOrientation;
      }
      if (!this.cameraStream) {
        throw new Error("Camera stream unavailable after initialization");
      }
      return this.cameraStream;
    } catch (e: any) {
      Logger.error("Camera access failed", e);
      Logger.setStatus(this.getCameraMicErrorMessage(e));
      throw e;
    }
  }
   private replaceVideoTrack(track: MediaStreamTrack){
    if(!this.plugin) return;
    try {
      this.plugin.replaceTracks({
        tracks:[{ type:"video", capture:track, recv:false }]
      });
      this.media.setLocalTrack(this.localVideo, track);
    } catch (e: any) {
      Logger.error("replaceVideoTrack failed", e);
      Logger.setStatus("Video track switch failed.");
    }
  }
}
