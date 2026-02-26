// import {Dom} from "./Dom";
// import {CallController} from "../managers/CallController";

class UIController {

  private getQueryParam(key: string): string | null {
    try {
      return new URLSearchParams(window.location.search).get(key);
    } catch {
      return null;
    }
  }

  private logger: Logger;
  private bus = new EventBus();
  private controller: CallController;

  private btnMute = document.getElementById("btnMute") as HTMLButtonElement;
  private btnUnpublish = document.getElementById("btnUnpublish") as HTMLButtonElement;
  private btnLeave = document.getElementById("btnLeave") as HTMLButtonElement;
  private btnReconnect = document.getElementById("btnReconnect") as HTMLButtonElement;
  private btnScreen = document.getElementById("btnScreen") as HTMLButtonElement;
  private btnVB = document.getElementById("btnVB") as HTMLButtonElement;

  // ✅ NEW
  private btnRecord = document.getElementById("btnRecord") as HTMLButtonElement;

  private lastCfg: JoinConfig | null = null;

  private bridge = new ParentBridge();
  private net = new NetworkQualityManager();
  private localVideoEl = document.getElementById("localVideo") as HTMLVideoElement;
  private remoteVideoEl = document.getElementById("remoteVideo") as HTMLVideoElement;
  private remoteFallback = document.getElementById("remoteFallback") as HTMLDivElement;

  private localOverlay = document.getElementById("localOverlay") as HTMLDivElement;
  private remoteOverlay = document.getElementById("remoteOverlay") as HTMLDivElement;
  private endedOverlay = document.getElementById("endedOverlay") as HTMLDivElement;

  private localQ = document.getElementById("localQuality") as HTMLDivElement;
  private remoteQ = document.getElementById("remoteQuality") as HTMLDivElement;
  private localQD = document.getElementById("localQualityDetails") as HTMLDivElement;
  private remoteQD = document.getElementById("remoteQualityDetails") as HTMLDivElement;
  private callMeta = document.getElementById("callMeta") as HTMLDivElement;

  private audioMuted = false;
  private videoMuted = false;
  private ended = false;
  private readonly userType = this.resolveUserType();
  private readonly canRecord = this.userType === "agent";
  private folderPath:string = APP_CONFIG.recording.folderPath;

  // ✅ recording state
  private recording = false;
  private renderedParticipantCount = 0;
  private connectionStatus: ConnectionStatusView | null = null;
  private remoteVideoMonitorTimer: number | null = null;

  constructor() {
    const qn = this.getQueryParam("name");
    if (qn) Logger.setUserName(qn);

    Logger.user("UI loaded. Initializing controllers...");
    Logger.flow("DOMContentLoaded → UIController()");

    this.logger = new Logger(
      document.getElementById("statusLine") as HTMLElement,
      document.getElementById("sessionInfo") as HTMLElement
    );

    const localVideo = this.localVideoEl;
    const remoteVideo = this.remoteVideoEl;

    this.controller = new CallController(this.bus, localVideo, remoteVideo);
    this.applyRecordingAccess();

    this.bus.on<boolean>("joined", j=>{
        this.setJoinedState(j);
        console.log("VCX_JOINED=" + j);
        this.updateDebugState({
          joined: j
        });
    });

    this.bus.on<boolean>("mute-changed", muted => {
      this.btnMute.innerHTML =
        muted
          ? '<i class="fa-solid fa-microphone-slash"></i>'
          : '<i class="fa-solid fa-microphone"></i>';
    });

    this.bus.on<boolean>("screen-changed", on => {
      this.btnScreen.title = on ? "Stop Screen Share" : "Start Screen Share";
    });

    this.bus.on<boolean>("vb-changed", on => {
      this.btnVB.title = on ? "Disable Virtual Background" : "Enable Virtual Background";
    });
    this.bus.on<boolean>("recording-changed", isRecording => {
        this.recording = isRecording;
        this.updateRecordUI();
        this.updateDebugState({
          recording: isRecording
        });
        this.bridge.emit({
          type: "RECORDING_CHANGED",
          recording: isRecording
        });
    });

    this.bus.on<any>("participants", (snapshot) => {
        const count = snapshot.participantIds.length;
        Logger.user(`Roster participants count: ${count}`);
        // SIMPLE LOG (automation-friendly)
        console.log("VCX_ROSTER_PARTICIPANTS=" + count);
        this.updateDebugState({
          rosterParticipants: count
        });
    });
    this.bus.on<any>("connectivity", (s) => {
        this.updateDebugState({
          iceState: s.ice,
          signalingState: s.signaling,
          connectionState: s.connection
        });
    });
    this.bus.on<ConnectionStatusView>("connection-status", (status) => {
      this.renderConnectionStatus(status);
    });

    this.wire();
    this.setupNetworkUI();
    this.setupParentBridge();
    this.setupRemoteFallbackMonitor();
    this.autoJoin();
  }

  private wire() {

    // AUDIO
    this.btnMute.onclick = () => {
      Logger.user("Audio button clicked → toggle mute");
      this.controller.toggleMute();

      this.audioMuted = !this.audioMuted;
      this.btnMute.classList.toggle("danger", this.audioMuted);
      this.applyConnectionOverlays();

      this.bridge.emit({ type: "AUDIO_MUTED", muted: this.audioMuted });
    };

    // VIDEO
    this.btnUnpublish.onclick = () => {
      Logger.user("Video button clicked");

      this.videoMuted = !this.videoMuted;
      this.btnUnpublish.classList.toggle("danger", this.videoMuted);

      if (this.videoMuted) {
        this.controller.stopVideo();
      } else {
        // republish
        this.controller.publish();
      }
      this.applyConnectionOverlays();

      this.bridge.emit({ type: "VIDEO_MUTED", muted: this.videoMuted });
    };

    // LEAVE / START
    this.btnLeave.onclick = () => {

      if (!this.ended) {
        Logger.user("End button clicked");
        this.controller.leave();

        this.ended = true;
        this.endedOverlay.style.display = "flex";
        this.renderRemoteFallback();

        this.btnLeave.innerHTML =
          '<i class="fa-solid fa-play"></i>';
        this.btnLeave.title = "Start";

        this.bridge.emit({ type: "CALL_ENDED" });
      } else {
        Logger.user("Start button clicked");
        this.autoJoin();
      }
    };

    this.btnReconnect.onclick = () => this.reconnect();

    this.btnScreen.onclick =
      () => this.controller.toggleScreenShare();

    this.btnVB.onclick =
      () => this.controller.toggleVirtualBackground();

    // ✅ RECORD BUTTON
    if (this.btnRecord) {
      this.btnRecord.onclick = () => {
        if (this.recording) {
          this.stopRecording("manual");
        } else {
          this.startRecording("manual");
        }
      };
    }
  }

  private resolveUserType(): "agent" | "customer" {
    const raw =
      this.getQueryParam("user_type") ??
      this.getQueryParam("usertpye") ??
      this.getQueryParam("usertype") ??
      "";
    return raw.trim().toLowerCase() === "agent" ? "agent" : "customer";
  }

  private applyRecordingAccess() {
    if (!this.btnRecord) return;
    if (this.canRecord) return;
    this.btnRecord.style.display = "none";
    this.btnRecord.disabled = true;
  }

  private syncAutoRecordingByParticipants(participantCount: number) {
    const shouldRecord = participantCount === 2;

    if (shouldRecord && !this.recording) {
      this.startRecording("auto");
      return;
    }

    if (!shouldRecord && this.recording) {
      this.stopRecording("auto");
    }
  }

  private startRecording(source: "manual" | "auto") {
    if (!this.canRecord) {
      Logger.user(`Recording blocked for user_type=${this.userType}`);
      return;
    }
    if (this.renderedParticipantCount !== 2) {
      Logger.setStatus("Recording requires both participants on live video.");
      Logger.user(`Recording blocked: rendered participants=${this.renderedParticipantCount}, required=2`);
      return;
    }
    if (this.recording) return;

    const rid = this.createRecordingId();
    Logger.user(`${source} start recording`);
    this.controller.startRecording(rid);
  }

  private stopRecording(source: "manual" | "auto") {
    if (!this.recording) return;

    Logger.user(`${source} stop recording`);
    this.controller.stopRecording();
  }
  private createRecordingId(): string{
    const participantId = this.lastCfg?.participantId;
    const recordingId = Number.isFinite(participantId as number)
      ? Number(participantId)
      : Math.floor(100000 + Math.random() * 900000);
    // Build Janus recording basename
    const rid = `${this.folderPath}/${recordingId}/rec_${Date.now()}`;
    Logger.user(`Recording generated -> id=${recordingId}, rid=${rid}`);
    return rid;
  }

  private updateRecordUI() {
    if (!this.btnRecord) return;

    if (this.recording) {
      this.btnRecord.classList.add("danger");
      this.btnRecord.innerHTML =
        '<i class="fa-solid fa-stop"></i>';
      this.btnRecord.title = "Stop Recording";
    } else {
      this.btnRecord.classList.remove("danger");
      this.btnRecord.innerHTML =
        '<i class="fa-solid fa-circle"></i>';
      this.btnRecord.title = "Start Recording";
    }
  }

  private autoJoin() {
    const cfg = UrlConfig.buildJoinConfig();
    this.lastCfg = cfg;
    this.recording = false;
    this.renderedParticipantCount = 0;
    this.updateRecordUI();
    this.renderCallMeta(cfg);

    Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}${cfg.participantId ? `, participantId=${cfg.participantId}` : ""}`);

    this.ended = false;
    this.endedOverlay.style.display = "none";
    this.renderRemoteFallback();

    this.btnLeave.innerHTML =
      '<i class="fa-solid fa-phone-slash"></i>';
    this.btnLeave.title = "End";

    this.controller.join(cfg);
    this.bridge.emit({ type: "CALL_STARTED" });
  }

  private renderCallMeta(cfg: JoinConfig) {
    if (!this.callMeta) return;
    this.callMeta.textContent = `RoomId: ${cfg.roomId} | Name: ${cfg.display}${cfg.participantId ? ` | ParticipantId: ${cfg.participantId}` : ""}`;
  }

  private reconnect() {
    if (!this.lastCfg) return;

    this.controller.leave();
    this.controller.markRetrying();
    this.renderRemoteFallback();

    // safer Janus reconnect
    setTimeout(() => {
      this.controller.join(this.lastCfg!);
    }, APP_CONFIG.call.reconnectDelayMs);
  }

  private setJoinedState(joined: boolean) {
    [
      this.btnMute,
      this.btnUnpublish,
      this.btnLeave,
      this.btnReconnect,
      this.btnScreen,
      this.btnVB
    ].forEach(b => b && (b.disabled = !joined));

    if (this.btnRecord) {
      this.btnRecord.disabled = !joined || !this.canRecord;
    }
  }

  private getLocalBaseOverlayText(): string {
    if (this.videoMuted) return "video muted";
    if (this.audioMuted) return "audio muted";
    return "Local";
  }

  private getRemoteBaseOverlayText(): string {
    if (this.videoMuted) return "video muted on other participant";
    if (this.audioMuted) return "audio muted on other participant";
    return "Remote";
  }

  private applyConnectionOverlays() {
    const localBase = this.getLocalBaseOverlayText();
    const remoteBase = this.getRemoteBaseOverlayText();
    const status = this.connectionStatus;

    if (!status) {
      this.localOverlay.innerText = localBase;
      this.remoteOverlay.innerText = remoteBase;
      return;
    }

    if (status.owner === "LOCAL") {
      this.localOverlay.innerText = status.primaryText;
      this.remoteOverlay.innerText = remoteBase;
      return;
    }

    if (status.owner === "REMOTE") {
      this.remoteOverlay.innerText = status.primaryText;
      this.localOverlay.innerText = localBase;
      return;
    }

    this.localOverlay.innerText = localBase;
    this.remoteOverlay.innerText = remoteBase;
  }

  private renderConnectionStatus(status: ConnectionStatusView) {
    this.connectionStatus = status;
    this.logger.setStatus(status.primaryText);
    this.logger.setInfo(status.secondaryText);
    this.applyConnectionOverlays();
    this.renderRemoteFallback();

    this.updateDebugState({
      connectionOwner: status.owner,
      connectionSeverity: status.severity,
      connectionState: status.state
    });
  }

  private setupRemoteFallbackMonitor() {
    const refresh = () => {
      this.refreshRenderedParticipantCount();
      this.renderRemoteFallback();
    };

    this.localVideoEl.onloadeddata = refresh;
    this.localVideoEl.onplaying = refresh;
    this.localVideoEl.onemptied = refresh;
    this.localVideoEl.onpause = refresh;
    this.remoteVideoEl.onloadeddata = refresh;
    this.remoteVideoEl.onplaying = refresh;
    this.remoteVideoEl.onemptied = refresh;
    this.remoteVideoEl.onpause = refresh;

    if (this.remoteVideoMonitorTimer !== null) {
      window.clearInterval(this.remoteVideoMonitorTimer);
    }
    this.remoteVideoMonitorTimer = window.setInterval(refresh, APP_CONFIG.ui.remoteFallbackRefreshMs);
    refresh();
  }

  private hasRenderableVideoTrack(videoEl: HTMLVideoElement): boolean {
    const ms = videoEl.srcObject as MediaStream | null;
    if (!ms) return false;
    const tracks = ms.getVideoTracks();
    if (!tracks || tracks.length === 0) return false;
    const hasLiveTrack = tracks.some(t => t.readyState === "live" && t.enabled !== false);
    if (!hasLiveTrack) return false;

    const hasDecodedFrame =
      videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      videoEl.videoWidth > 0 &&
      videoEl.videoHeight > 0;
    const hasStartedPlayback = videoEl.currentTime > 0.05;
    return hasDecodedFrame && hasStartedPlayback;
  }

  private hasLocalVideoTrack(): boolean {
    return this.hasRenderableVideoTrack(this.localVideoEl);
  }

  private hasRemoteVideoTrack(): boolean {
    return this.hasRenderableVideoTrack(this.remoteVideoEl);
  }

  private refreshRenderedParticipantCount() {
    const count =
      (this.hasLocalVideoTrack() ? 1 : 0) +
      (this.hasRemoteVideoTrack() ? 1 : 0);

    if (count === this.renderedParticipantCount) return;
    this.renderedParticipantCount = count;
    Logger.user(`Rendered participants count: ${count}`);
    console.log("VCX_PARTICIPANTS=" + count);
    this.updateDebugState({
      participants: count,
      participantsRendered: count
    });
    this.syncAutoRecordingByParticipants(count);
  }

  private renderRemoteFallback() {
    if (!this.remoteFallback) return;

    const showFallback = !this.ended && !this.hasRemoteVideoTrack();
    this.remoteFallback.style.display = showFallback ? "flex" : "none";
  }

  private setupNetworkUI() {
    const toggle = (el: HTMLElement) =>
      el.classList.toggle("show");

    this.localQ.onclick = () => toggle(this.localQD);
    this.remoteQ.onclick = () => toggle(this.remoteQD);

    this.net.start((l, r, d) => {
      this.localQ.textContent = `Local: ${l}`;
      this.remoteQ.textContent = `Remote: ${r}`;
      this.localQD.textContent = d;
      this.remoteQD.textContent = d;

      Logger.net(`Local ${l} | Remote ${r} | ${d}`);

      this.bridge.emit({
        type: "NETWORK_CHANGED",
        local: l,
        remote: r
      });
    });
  }

  private setupParentBridge() {
    this.bridge.onCommand((cmd: any) => {
      switch (cmd.type) {
        case "START_CALL":
          this.controller.join(this.lastCfg!);
          break;

        case "STOP_CALL":
          this.controller.leave();
          break;

        case "TOGGLE_AUDIO":
          this.btnMute.click();
          break;

        case "TOGGLE_VIDEO":
          this.btnUnpublish.click();
          break;

        case "RECONNECT":
          this.reconnect();
          break;

        // ✅ recording events
        case "START_RECORDING":
          this.startRecording("manual");
          break;

        case "STOP_RECORDING":
          this.stopRecording("manual");
          break;

        case "TOGGLE_RECORDING":
          this.btnRecord.click();
          break;
      }
    });
  }
  private updateDebugState(extra:any = {}) {
    const dbg = (window as any).__vcxDebug || {};
    (window as any).__vcxDebug = {
      ...dbg,
      ...extra,
      timestamp: Date.now()
    };

    console.log("VCX_DEBUG", (window as any).__vcxDebug);
  }
}

