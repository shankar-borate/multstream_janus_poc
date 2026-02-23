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

  constructor(
    private bus: EventBus,
    private localVideo: HTMLVideoElement,
    private remoteVideo: HTMLVideoElement
  ) {
    this.gateway = new JanusGateway();
    this.media = new MediaManager();
    this.vbManager = new VirtualBackgroundManager();
    this.gateway.init();
  }

  async join(cfg: JoinConfig) {

    const server = UrlConfig.getVcxServer().server;
    const clientId = UrlConfig.getVcxServer().client_id;

    const http: HttpClient = new HttpClient(server, clientId);
    const ims = new ImsClient(http);
    const payload = await ims.getMediaConstraints();

    this.gateway.createSession(
      cfg.server,
      payload.PC_CONFIG?.iceServers,
      () => this.attachAndEnsureRoomThenJoin(cfg),
      () => Logger.setStatus("Session destroyed")
    );
  }

  private attachAndEnsureRoomThenJoin(cfg: JoinConfig) {

    this.gateway.attachPublisher(
      (h: any) => {

        this.plugin = h;
        this.joinedRoom = false;
        this.roomCreateAttempted = false;
        this.selfId = null;
        this.roster.reset();

        // reset recording
        this.recording = false;
        this.currentRecordingId = null;
        this.bus.emit("recording-changed", false);

        Logger.setStatus("Plugin attached. Checking room...");
        this.ensureRoomThenJoin(cfg);
      },
      (msg: any, jsep: any) => this.onPublisherMessage(cfg, msg, jsep),
      (track: any, on: any) => {
        if (on && track.kind === "video") {
          this.media.setLocalTrack(this.localVideo, track);
        }
      },
      () => Logger.setStatus("Publisher cleanup")
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
      error: () => this.leave()
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
        publishers: 10,
        description: `Room ${cfg.roomId}`
      },
      success: () => {
        Logger.setStatus("Room created. Joining...");
        this.sendPublisherJoin(cfg);
      },
      error: () => this.leave()
    });
  }

  private onPublisherMessage(cfg: JoinConfig, msg: any, jsep: any) {

    const data = this.getVideoRoomData(msg);
    const event = data["videoroom"];
    const errorCode = data["error_code"];

    if (event === "event" && errorCode === 426) {
      if (!this.roomCreateAttempted) {
        this.roomCreateAttempted = true;
        this.sendCreateRoom(cfg);
      } else {
        this.leave();
      }
      return;
    }

    if (event === "joined") {

      this.joinedRoom = true;
      this.currentRoomId = cfg.roomId;

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
        this.remoteVideo
      );

      this.publish();
      this.reconcile(cfg, data["publishers"]);
      this.bus.emit("joined", true);
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
    }

    if (event === "destroyed") {
      this.leave();
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
        this.remoteFeeds.addFeed(feedId);
      }
    });

    this.bus.emit("participants", this.roster.snapshot(cfg.roomId));
  }

  private removeParticipant(cfg: JoinConfig, feedId: number) {
    if (feedId === this.selfId) return;
    this.roster.remove(feedId);
    this.remoteFeeds?.removeFeed(feedId);
    this.bus.emit("participants", this.roster.snapshot(cfg.roomId));
  }

  // =====================================
  // MEDIA
  // =====================================

  public publish() {
    this.plugin.createOffer({
      tracks: [
        { type: "audio", capture: true, recv: false },
        { type: "video", capture: true, recv: false }
      ],
      success: (jsep: any) => {
        this.plugin.send({
          message: { request: "configure", audio: true, video: true },
          jsep
        });
      }
    });
  }

  toggleMute() {
    if (!this.plugin) return;
    const m = this.plugin.isAudioMuted();
    m ? this.plugin.unmuteAudio() : this.plugin.muteAudio();
    this.bus.emit("mute-changed", !m);
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

      if (this.recording) this.stopRecording();

      try {
        if (this.joinedRoom) {
          this.plugin?.send({ message: { request: "leave" } });
        }
      } catch {}

      this.remoteFeeds?.cleanupAll();
      this.remoteFeeds = null;

      this.plugin = null;
      this.gateway.destroy();

      this.joinedRoom = false;
      this.recording = false;
      this.currentRecordingId = null;
      this.currentRoomId = null;
      this.selfId = null;
      this.roster.reset();

      this.bus.emit("recording-changed", false);
      this.bus.emit("joined", false);

      this.media.clearLocal(this.localVideo);
      this.media.clearRemote(this.remoteVideo);

      Logger.setStatus("Left");

    } catch (e: any) {
      Logger.setStatus("Leave error: " + e.message);
    }
  }
}
