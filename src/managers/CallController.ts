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
    this.activeJoinCfg = cfg;
    this.isLeaving = false;
    this.suppressPublisherCleanupRetry = false;
    if (!opts?.internalRetry) {
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;
      this.clearRetryTimer();
    }
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
      this.scheduleServerRetry("Join error: " + (e?.message || e));
    }
  }

  private clearRetryTimer() {
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private cleanupForRetry() {
    this.remoteFeeds?.cleanupAll();
    this.remoteFeeds = null;
    this.plugin = null;
    this.stopParticipantSync();
    this.joinedRoom = false;
    this.roomCreateAttempted = false;
    this.privateId = null;
    this.selfId = null;
    this.roster.reset();
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
      Logger.user(`[retry] ${kind} retries exhausted. reason=${reason}`);
      return;
    }

    if (kind === "server") {
      this.connectionEngine.onServerRetrying(attempt, maxAttempts);
      Logger.setStatus(`Video server call failed. Retrying (${attempt}/${maxAttempts})...`);
    } else {
      this.connectionEngine.onPeerRetrying(attempt, maxAttempts);
      Logger.setStatus(`TURN/peer connection failed. Retrying (${attempt}/${maxAttempts})...`);
    }
    Logger.user(`[retry] ${kind} scheduled (${attempt}/${maxAttempts}). reason=${reason}`);

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
    this.plugin.send({
      message: {
        request: "join",
        room: cfg.roomId,
        ptype: "publisher",
        display: cfg.display
      }
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

  private onPublisherMessage(cfg: JoinConfig, msg: any, jsep: any) {
    if (msg?.janus === "hangup") {
      const reason = String(msg?.reason || "Peer hangup");
      if (reason.toLowerCase().includes("ice")) {
        this.schedulePeerRetry(`Publisher hangup: ${reason}`);
      }
      return;
    }

    const data = this.getVideoRoomData(msg);
    const event = data["videoroom"];
    const errorCode = data["error_code"];

    if (event === "event" && errorCode === 426) {
      if (!this.roomCreateAttempted) {
        this.roomCreateAttempted = true;
        this.sendCreateRoom(cfg);
      } else {
        this.connectionEngine.onFailed();
        this.leave();
      }
      return;
    }

    if (event === "joined") {

      this.joinedRoom = true;
      this.currentRoomId = cfg.roomId;
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;
      this.clearRetryTimer();
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
            this.connectionEngine.registerSubscriberPc(feedId, pc);
          },
          onRemoteTrackSignal: (feedId: number, track: MediaStreamTrack, on: boolean) => {
            this.connectionEngine.onRemoteTrackSignal(feedId, track, on);
          },
          onRemoteFeedCleanup: (feedId: number) => {
            this.connectionEngine.unregisterSubscriber(feedId);
            if (this.remoteFeeds && this.roster.has(feedId) && feedId !== this.selfId) {
              window.setTimeout(() => {
                this.remoteFeeds?.addFeed(feedId);
              }, APP_CONFIG.call.remoteFeedRetryDelayMs);
            }
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

    this.plugin.send({
      message: { request: "listparticipants", room: cfg.roomId },
      success: (res: any) => {
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
      error: () => {
        this.participantSyncInFlight = false;
      }
    });
  }

  private removeParticipant(cfg: JoinConfig, feedId: number) {
    if (feedId === this.selfId) return;
    this.roster.remove(feedId);
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
        console.log("VCX_SET_PARAMETERS_ERROR=", e?.message || e);
      });
    } catch (e: any) {
      console.log("VCX_SET_PARAMETERS_HOOK_ERROR=", e?.message || e);
    }
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

  public publish() {
    if (!this.plugin) {
      Logger.setStatus("Publish ignored: plugin not ready");
      return;
    }
    const videoCfg = this.getVideoConfig();

    this.plugin.createOffer({
      tracks: [
        { type: "audio", capture: true, recv: false },
        { type: "video", capture: true, recv: false },
      ],

      success: (jsep: any) => {
        // ✅ Point #4: capture and emit connectivity info from RTCPeerConnection
        try {
          // TODO: If Janus internals change and webrtcStuff.pc is unavailable, bind the publisher PC from Janus plugin callbacks.
          const pc: RTCPeerConnection | undefined = this.plugin?.webrtcStuff?.pc;

          if (pc) {
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
          console.log("VCX_CONNECTIVITY=hook_error", e?.message || e);
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
        this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
        Logger.setStatus("Offer error. Recovering media path...");
        console.log("VCX_OFFER_ERROR=", e);
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

  stopVideo() {
    this.plugin?.send({ message: { request: "unpublish" } });
  }

  // =====================================
  // RECORDING
  // =====================================

  public startRecording(recordingId: string) {

    if (!this.plugin || !this.joinedRoom) return;
    if (this.recording) return;

    this.currentRecordingId = recordingId;

    this.plugin.send({
      message: {
        request: "configure",
        record: true,
        room:this.currentRoomId,
        filename: recordingId
      },
      success: () => {
        this.recording = true;
        Logger.setStatus(`Recording started: ${recordingId}`);
        this.bus.emit("recording-changed", true);
      },
      error: () => {
        this.recording = false;
        this.bus.emit("recording-changed", false);
      }
    });
  }

  public stopRecording() {

    if (!this.plugin || !this.recording) return;

    this.plugin.send({
      message: { request: "configure", record: false },
      success: () => {
        this.recording = false;
        Logger.setStatus("Recording stopped");
        this.bus.emit("recording-changed", false);
      }
    });
  }

  // =====================================
  // LEAVE
  // =====================================

  leave() {

    try {
      this.isLeaving = true;
      this.clearRetryTimer();
      this.serverRetryAttempt = 0;
      this.peerRetryAttempt = 0;

      if (this.recording) this.stopRecording();

      try {
        if (this.joinedRoom) {
          this.plugin?.send({ message: { request: "leave" } });
        }
      } catch {}

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
      this.roster.reset();

      this.bus.emit("recording-changed", false);
      this.bus.emit("joined", false);
      this.connectionEngine.onLeft();

      this.media.clearLocal(this.localVideo);
      this.media.clearRemote(this.remoteVideo);

      Logger.setStatus("Left");

    } catch (e: any) {
      Logger.setStatus("Leave error: " + e.message);
    }
  }

    async toggleScreenShare(){
    if(!this.plugin) return;

    if(!this.screenEnabled){
      const ss = await this.screenManager.start();
      const track = ss.getVideoTracks()[0];
      if(!track) return;
      this.screenEnabled = true;
      this.replaceVideoTrack(track);
      Logger.setStatus("Screen share started");
      this.bus.emit("screen-changed", true);
      track.onended = ()=>{ if(this.screenEnabled) this.toggleScreenShare(); };
    } else {
      this.screenManager.stop();
      this.screenEnabled = false;
      const cam = await this.ensureCameraStream();
      const track = cam.getVideoTracks()[0];
      if(track) this.replaceVideoTrack(track);
      Logger.setStatus("Screen share stopped");
      this.bus.emit("screen-changed", false);
    }
  }

  async toggleVirtualBackground(){
    if(!this.plugin) return;
    if(this.screenEnabled){
      Logger.setStatus("Disable screen share before virtual background");
      return;
    }

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
  }
  private async ensureCameraStream(){
    if(!this.cameraStream){
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
    }
    return this.cameraStream;
  }
   private replaceVideoTrack(track: MediaStreamTrack){
    if(!this.plugin) return;
    this.plugin.replaceTracks({
      tracks:[{ type:"video", capture:track, recv:false }]
    });
    this.media.setLocalTrack(this.localVideo, track);
  }
}
