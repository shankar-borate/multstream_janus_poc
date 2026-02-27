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
  private mediaIoBytes = document.getElementById("mediaIoBytes") as HTMLDivElement;
  private mediaIoIssues = document.getElementById("mediaIoIssues") as HTMLDivElement;
  private mRemoteRecvVideo = document.getElementById("mRemoteRecvVideo") as HTMLDivElement;
  private mRemoteRecvAudio = document.getElementById("mRemoteRecvAudio") as HTMLDivElement;
  private mRemoteAudioPlayback = document.getElementById("mRemoteAudioPlayback") as HTMLDivElement;
  private mRemoteVideoPlayback = document.getElementById("mRemoteVideoPlayback") as HTMLDivElement;
  private mLocalRecvVideo = document.getElementById("mLocalRecvVideo") as HTMLDivElement;
  private mLocalRecvAudio = document.getElementById("mLocalRecvAudio") as HTMLDivElement;
  private mLocalAudioPlayback = document.getElementById("mLocalAudioPlayback") as HTMLDivElement;
  private mLocalVideoPlayback = document.getElementById("mLocalVideoPlayback") as HTMLDivElement;

  private audioMuted = false;
  private videoMuted = false;
  private ended = false;
  private readonly userType = this.resolveUserType();
  private readonly canRecord = this.userType === "agent";
  private folderPath:string = APP_CONFIG.recording.folderPath;

  // ✅ recording state
  private recording = false;
  private renderedParticipantCount = 0;
  private lastRemoteVideoTime = 0;
  private remoteVideoFrameProgressAt = 0;
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
    this.bus.on<boolean>("video-mute-changed", muted => {
      this.videoMuted = muted;
      this.btnUnpublish.classList.toggle("danger", muted);
      this.btnUnpublish.innerHTML =
        muted
          ? '<i class="fa-solid fa-video-slash"></i>'
          : '<i class="fa-solid fa-video"></i>';
      this.applyConnectionOverlays();
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
    this.bus.on<any>("telemetry-context", (ctx) => {
      this.updateDebugState({
        callId: ctx?.callId,
        roomId: ctx?.roomId,
        participantId: ctx?.participantId
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
    this.bus.on<MediaIoSnapshot>("media-io", (stats) => {
      this.renderMediaIo(stats);
    });
    this.bus.on<any>("call-ended", (payload) => {
      Logger.user(`Call ended event received: ${payload?.reason || "unknown"}`);
      this.setEndedState(true);
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
    this.btnUnpublish.onclick = async () => {
      Logger.user("Video button clicked");
      if (this.btnUnpublish.disabled) return;
      this.btnUnpublish.disabled = true;
      try {
        const enabled = await this.controller.setVideoEnabled(this.videoMuted);
        this.videoMuted = !enabled;
      } finally {
        if (!this.ended) this.btnUnpublish.disabled = false;
      }
      this.applyConnectionOverlays();

      this.bridge.emit({ type: "VIDEO_MUTED", muted: this.videoMuted });
    };

    // LEAVE / START
    this.btnLeave.onclick = () => {

      if (!this.ended) {
        Logger.user("End button clicked");
        this.controller.leave();
        this.setEndedState(true);

        this.bridge.emit({ type: "CALL_ENDED" });
      } else {
        Logger.user("Start button clicked");
        this.autoJoin();
      }
    };

    this.btnReconnect.onclick = () => this.reconnect();

    this.btnScreen.onclick = async () => {
      if (this.btnScreen.disabled) return;
      this.btnScreen.disabled = true;
      try {
        await this.controller.toggleScreenShare();
      } finally {
        if (!this.ended) this.btnScreen.disabled = false;
      }
    };

    this.btnVB.onclick = async () => {
      if (this.btnVB.disabled) return;
      this.btnVB.disabled = true;
      try {
        await this.controller.toggleVirtualBackground();
      } finally {
        if (!this.ended) this.btnVB.disabled = false;
      }
    };

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

  private setEndedState(ended: boolean) {
    this.ended = ended;
    this.endedOverlay.style.display = ended ? "flex" : "none";
    this.renderRemoteFallback();
    if (ended) {
      this.btnLeave.innerHTML = '<i class="fa-solid fa-play"></i>';
      this.btnLeave.title = "Start";
      this.btnLeave.disabled = false;
      return;
    }
    this.btnLeave.innerHTML = '<i class="fa-solid fa-phone-slash"></i>';
    this.btnLeave.title = "End";
  }

  private autoJoin() {
    const cfg = UrlConfig.buildJoinConfig();
    this.lastCfg = cfg;
    this.recording = false;
    this.renderedParticipantCount = 0;
    this.lastRemoteVideoTime = 0;
    this.remoteVideoFrameProgressAt = 0;
    this.updateRecordUI();
    this.renderCallMeta(cfg);

    Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}${cfg.participantId ? `, participantId=${cfg.participantId}` : ""}`);

    this.audioMuted = false;
    this.videoMuted = false;
    this.setEndedState(false);
    this.applyConnectionOverlays();

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
      this.btnReconnect,
      this.btnScreen,
      this.btnVB
    ].forEach(b => b && (b.disabled = !joined));

    this.btnLeave.disabled = this.ended ? false : !joined;

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
    const resolved = this.resolveVisibleConnectionStatus(status);
    this.connectionStatus = resolved;
    this.logger.setStatus(resolved.primaryText);
    this.logger.setInfo(resolved.secondaryText);
    this.applyConnectionOverlays();
    this.renderRemoteFallback();

    this.updateDebugState({
      connectionOwner: resolved.owner,
      connectionSeverity: resolved.severity,
      connectionState: resolved.state
    });
  }

  private resolveVisibleConnectionStatus(status: ConnectionStatusView): ConnectionStatusView {
    // Keep hard failures visible as-is.
    if (status.severity === "error" || status.state === "FAILED") {
      return status;
    }
    const inSetupPhase = status.state === "NEGOTIATING" || status.state === "WAITING_REMOTE";
    if (!inSetupPhase) {
      return status;
    }
    // If both videos are actually live in the UI, present connected state.
    if (this.hasLocalVideoTrack() && this.hasRemoteVideoTrack()) {
      return {
        owner: "NEUTRAL",
        severity: "info",
        state: "CONNECTED",
        primaryText: "Connected",
        secondaryText: "Video and audio are live."
      };
    }
    return status;
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

  private hasLiveVideoTrack(videoEl: HTMLVideoElement): boolean {
    const ms = videoEl.srcObject as MediaStream | null;
    if (!ms) return false;
    const tracks = ms.getVideoTracks();
    if (!tracks || tracks.length === 0) return false;
    return tracks.some(t => t.readyState === "live" && t.enabled !== false);
  }

  private hasRenderableVideoTrack(videoEl: HTMLVideoElement): boolean {
    if (!this.hasLiveVideoTrack(videoEl)) return false;

    const hasDecodedFrame =
      videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      videoEl.videoWidth > 0 &&
      videoEl.videoHeight > 0;
    const isPlaying = !videoEl.paused;
    return hasDecodedFrame && isPlaying;
  }

  private hasLocalVideoTrack(): boolean {
    // Local participant is considered present when local camera track is live.
    return this.hasLiveVideoTrack(this.localVideoEl);
  }

  private hasRemoteVideoTrack(): boolean {
    this.updateRemoteVideoProgress();
    if (!this.hasRenderableVideoTrack(this.remoteVideoEl)) return false;
    if (this.remoteVideoFrameProgressAt === 0) return false;
    return Date.now() - this.remoteVideoFrameProgressAt <= APP_CONFIG.ui.remoteVideoStallThresholdMs;
  }

  private updateRemoteVideoProgress() {
    const now = Date.now();
    if (!this.hasLiveVideoTrack(this.remoteVideoEl)) {
      this.lastRemoteVideoTime = 0;
      this.remoteVideoFrameProgressAt = 0;
      return;
    }

    const currentTime = Number.isFinite(this.remoteVideoEl.currentTime) ? this.remoteVideoEl.currentTime : 0;
    if (currentTime + 0.01 < this.lastRemoteVideoTime) {
      this.lastRemoteVideoTime = currentTime;
      this.remoteVideoFrameProgressAt = 0;
      return;
    }

    if (currentTime > this.lastRemoteVideoTime + 0.03) {
      this.lastRemoteVideoTime = currentTime;
      this.remoteVideoFrameProgressAt = now;
      return;
    }

    if (this.remoteVideoFrameProgressAt === 0 && currentTime > 0) {
      this.remoteVideoFrameProgressAt = now;
    }
  }

  private refreshRenderedParticipantCount() {
    this.updateRemoteVideoProgress();
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

  private formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
    if (bytes < 1024) return `${Math.floor(bytes)}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  private formatQuality(v: number | null): string {
    if (v === null || !Number.isFinite(v)) return "n/a";
    return `${v.toFixed(1)}`;
  }

  private renderMediaIo(stats: MediaIoSnapshot) {
    if (this.mediaIoBytes) {
      this.mediaIoBytes.textContent =
        `A(sent/recv): ${this.formatBytes(stats.bytes.audioSent)} / ${this.formatBytes(stats.bytes.audioReceived)} | ` +
        `V(sent/recv): ${this.formatBytes(stats.bytes.videoSent)} / ${this.formatBytes(stats.bytes.videoReceived)}`;
    }
    if (this.mediaIoIssues) {
      this.mediaIoIssues.textContent = stats.issues.length > 0
        ? stats.issues.join(" | ")
        : "";
    }

    this.mRemoteRecvVideo.textContent = stats.matrix.remoteReceivingYourVideo;
    this.mRemoteRecvAudio.textContent = stats.matrix.remoteReceivingYourAudio;
    this.mRemoteAudioPlayback.textContent = stats.matrix.remoteAudioPlaybackStatus;
    this.mRemoteVideoPlayback.textContent = stats.matrix.remoteVideoPlaybackStatus;
    this.mLocalRecvVideo.textContent = stats.matrix.localReceivingYourVideo;
    this.mLocalRecvAudio.textContent = stats.matrix.localReceivingYourAudio;
    this.mLocalAudioPlayback.textContent = stats.matrix.localAudioPlaybackStatus;
    this.mLocalVideoPlayback.textContent = stats.matrix.localVideoPlaybackStatus;

    this.localQD.textContent =
      `jitter=${this.formatQuality(stats.quality.localJitterMs)}ms loss=${this.formatQuality(stats.quality.localLossPct)}%`;
    this.remoteQD.textContent =
      `jitter=${this.formatQuality(stats.quality.remoteJitterMs)}ms loss=${this.formatQuality(stats.quality.remoteLossPct)}%`;
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
    }, () => this.controller.getNetworkQualityPeers());
  }

  private setupParentBridge() {
    this.bridge.onCommand((cmd: any) => {
      switch (cmd.type) {
        case "START_CALL":
          this.controller.join(this.lastCfg!);
          break;

        case "STOP_CALL":
          this.controller.leave();
          this.setEndedState(true);
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

