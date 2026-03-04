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
  private lastGroupId: number | null = null;
  private autoJoinSeq = 0;

  private bridge = new ParentBridge();
  private net = new NetworkQualityManager();
  private participantNet = new ParticipantNetworkStatsManager();
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
  private networkSidePanel = document.getElementById("networkSidePanel") as HTMLDivElement;
  private networkPanelBtn = document.getElementById("networkPanelBtn") as HTMLButtonElement;
  private networkPanelPopup = document.getElementById("networkPanelPopup") as HTMLDivElement;
  private networkPanelClose = document.getElementById("networkPanelClose") as HTMLButtonElement;
  private networkPopupBody = document.getElementById("networkPopupBody") as HTMLDivElement;
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
  private prevMediaBytes: MediaIoSnapshot["bytes"] | null = null;

  private audioMuted = false;
  private videoMuted = false;
  private ended = false;
  private readonly userType = this.resolveUserType();
  private readonly canRecord = this.userType === "agent";

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
      this.audioMuted = muted;
      this.btnMute.classList.toggle("danger", muted);
      this.btnMute.innerHTML =
        muted
          ? '<i class="fa-solid fa-microphone-slash"></i>'
          : '<i class="fa-solid fa-microphone"></i>';
      this.applyConnectionOverlays();
      this.bridge.emit({ type: "AUDIO_MUTED", muted });
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
    this.bus.on<JanusSlowLinkSignal>("janus-slowlink", (signal) => {
      this.participantNet.recordSlowLink(signal);
    });
    this.bus.on<{ feedId: number; payload: PeerNetworkTelemetry }>("peer-network-telemetry", (evt) => {
      this.participantNet.recordRemoteNetworkTelemetry(evt.feedId, evt.payload);
    });
    this.bus.on<any>("call-ended", (payload) => {
      Logger.user(`Call ended event received: ${payload?.reason || "unknown"}`);
      this.setEndedState(true);
    });

    this.wire();
    this.setupNetworkUI();
    this.setupParticipantNetworkPanel();
    this.setupParentBridge();
    this.setupRemoteFallbackMonitor();
    this.autoJoin();
  }

  private wire() {

    // AUDIO
    this.btnMute.onclick = () => {
      Logger.user("Audio button clicked -> toggle mute");
      this.controller.toggleMute();
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
          void this.startRecording("manual");
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
      void this.startRecording("auto");
      return;
    }

    if (!shouldRecord && this.recording) {
      this.stopRecording("auto");
    }
  }

  private async startRecording(source: "manual" | "auto") {
    await this.controller.startRecording(source, this.renderedParticipantCount);
  }

  private stopRecording(source: "manual" | "auto") {
    this.controller.stopRecording(source);
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

  private async autoJoin() {
    let req: JoinBootstrapConfig;
    try {
      req = UrlConfig.buildJoinConfig();
    } catch (e: any) {
      Logger.error("Join config parse failed", e);
      return;
    }
    const joinSeq = ++this.autoJoinSeq;
    this.lastGroupId = req.groupId;
    this.controller.clearRecordingMeetingContext();
    this.recording = false;
    this.renderedParticipantCount = 0;
    this.lastRemoteVideoTime = 0;
    this.remoteVideoFrameProgressAt = 0;
    this.updateRecordUI();
    this.renderCallMeta(req.display, req.participantId);

    Logger.setStatus(`Creating meeting... groupId=${req.groupId}, name=${req.display}${req.participantId ? `, participantId=${req.participantId}` : ""}`);
    Logger.user(`[rms] create meeting request groupId=${req.groupId} (payload groupId=null, to=${req.groupId})`);

    this.audioMuted = false;
    this.videoMuted = false;
    this.setEndedState(false);
    this.applyConnectionOverlays();

    try {
      const roomId = await this.resolveMeetingRoomId(req.groupId);
      if (joinSeq !== this.autoJoinSeq) return;

      const cfg: JoinConfig = {
        server: req.server,
        roomId,
        display: req.display,
        participantId: req.participantId
      };
      this.lastCfg = cfg;
      this.controller.setRecordingMeetingContext(req.groupId, cfg.roomId);
      this.renderCallMeta(cfg.display, cfg.participantId, cfg.roomId);
      this.updateDebugState({
        groupId: req.groupId,
        roomId: cfg.roomId
      });

      Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}${cfg.participantId ? `, participantId=${cfg.participantId}` : ""}`);
      this.controller.join(cfg);
      this.bridge.emit({ type: "CALL_STARTED" });
    } catch (e: any) {
      if (joinSeq !== this.autoJoinSeq) return;
      Logger.error(ErrorMessages.RMS_MEETING_CREATE_FAILED, e);
      Logger.setStatus(ErrorMessages.RMS_MEETING_CREATE_FAILED);
    }
  }

  private async resolveMeetingRoomId(groupId: number): Promise<number> {
    const server = UrlConfig.getVcxServer().server;
    const clientId = UrlConfig.getVcxServer().client_id;
    const http = new HttpClient(server, clientId);
    const rms = new RmsClient(http);
    const meetingId = await rms.createMeetingByGroup(groupId);
    Logger.user(`[rms] meeting created groupId=${groupId} -> meetingId(roomId)=${meetingId}`);
    return meetingId;
  }

  private renderCallMeta(display: string, participantId?: number, roomId?: number) {
    if (!this.callMeta) return;
    const groupText = this.lastGroupId ?? "-";
    const roomText = Number.isFinite(roomId as number) ? String(roomId) : "Pending";
    this.callMeta.textContent =
      `GroupId: ${groupText} | RoomId: ${roomText} | Name: ${display}` +
      `${participantId ? ` | ParticipantId: ${participantId}` : ""}`;
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

  private formatFlowBytes(
    current: number,
    previous: number | null,
    minDeltaBytes: number,
    forceStopped: boolean = false
  ): { text: string; color: string } {
    const delta = previous === null ? 0 : Math.max(0, current - previous);
    const flowing = !forceStopped && delta >= minDeltaBytes;
    const symbol = flowing ? "+" : "x";
    const color = flowing ? "#16a34a" : "#dc2626";
    return {
      text: `${this.formatBytes(delta)} [${symbol}]`,
      color
    };
  }

  private renderStatusBadge(el: HTMLElement, value: string) {
    const normalized = String(value || "").trim();
    let symbol = "•";
    let color = "#6b7280";

    if (normalized === "Yes" || normalized === "Active") {
      symbol = "✔";
      color = "#16a34a";
    } else if (normalized === "No" || normalized === "Stalled" || normalized === "Not possible") {
      symbol = "✖";
      color = "#dc2626";
    } else if (normalized === "Pending") {
      symbol = "•";
      color = "#d97706";
    }

    el.textContent = `${symbol} ${normalized}`;
    el.style.color = color;
    el.style.fontWeight = "600";
  }

  private renderMediaIo(stats: MediaIoSnapshot) {
    if (this.mediaIoBytes) {
      const prev = this.prevMediaBytes;
      const audioMinDeltaBytes = 64;
      const videoMinDeltaBytes = 512;
      const aSent = this.formatFlowBytes(stats.bytes.audioSent, prev?.audioSent ?? null, audioMinDeltaBytes, this.audioMuted);
      const aRecv = this.formatFlowBytes(stats.bytes.audioReceived, prev?.audioReceived ?? null, audioMinDeltaBytes, false);
      const vSent = this.formatFlowBytes(stats.bytes.videoSent, prev?.videoSent ?? null, videoMinDeltaBytes, this.videoMuted);
      const vRecv = this.formatFlowBytes(stats.bytes.videoReceived, prev?.videoReceived ?? null, videoMinDeltaBytes, false);
      this.mediaIoBytes.innerHTML =
        `A(sent/recv): <span style="color:${aSent.color};font-weight:600">${aSent.text}</span> / ` +
        `<span style="color:${aRecv.color};font-weight:600">${aRecv.text}</span> | ` +
        `V(sent/recv): <span style="color:${vSent.color};font-weight:600">${vSent.text}</span> / ` +
        `<span style="color:${vRecv.color};font-weight:600">${vRecv.text}</span>`;
    }
    if (this.mediaIoIssues) {
      this.mediaIoIssues.textContent = stats.issues.length > 0
        ? stats.issues.join(" | ")
        : "";
    }

    this.renderStatusBadge(this.mRemoteRecvVideo, stats.matrix.remoteReceivingYourVideo);
    this.renderStatusBadge(this.mRemoteRecvAudio, stats.matrix.remoteReceivingYourAudio);
    this.renderStatusBadge(this.mRemoteAudioPlayback, stats.matrix.remoteAudioPlaybackStatus);
    this.renderStatusBadge(this.mRemoteVideoPlayback, stats.matrix.remoteVideoPlaybackStatus);
    this.renderStatusBadge(this.mLocalRecvVideo, stats.matrix.localReceivingYourVideo);
    this.renderStatusBadge(this.mLocalRecvAudio, stats.matrix.localReceivingYourAudio);
    this.renderStatusBadge(this.mLocalAudioPlayback, stats.matrix.localAudioPlaybackStatus);
    this.renderStatusBadge(this.mLocalVideoPlayback, stats.matrix.localVideoPlaybackStatus);

    this.localQD.textContent =
      `jitter=${this.formatQuality(stats.quality.localJitterMs)}ms loss=${this.formatQuality(stats.quality.localLossPct)}%`;
    this.remoteQD.textContent =
      `jitter=${this.formatQuality(stats.quality.remoteJitterMs)}ms loss=${this.formatQuality(stats.quality.remoteLossPct)}%`;
    this.prevMediaBytes = { ...stats.bytes };
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

  private setupParticipantNetworkPanel() {
    if (
      !this.networkSidePanel ||
      !this.networkPanelBtn ||
      !this.networkPanelPopup ||
      !this.networkPopupBody ||
      !this.networkPanelClose
    ) {
      return;
    }

    const closePopup = () => {
      this.networkPanelPopup.classList.remove("show");
    };
    const openPopup = () => {
      this.networkPanelPopup.classList.add("show");
    };

    this.networkPanelBtn.onclick = () => {
      if (!this.isParticipantNetworkPopupMode()) return;
      if (this.networkPanelPopup.classList.contains("show")) {
        closePopup();
      } else {
        openPopup();
      }
    };
    this.networkPanelClose.onclick = closePopup;
    this.networkPanelPopup.onclick = (ev: MouseEvent) => {
      if (ev.target === this.networkPanelPopup) closePopup();
    };
    window.addEventListener("resize", () => {
      if (!this.isParticipantNetworkPopupMode()) {
        closePopup();
      }
    });

    this.participantNet.start(
      (snapshot: ParticipantNetworkSnapshot) => this.renderParticipantNetwork(snapshot),
      () => this.controller.getParticipantNetworkPeers()
    );
  }

  private isParticipantNetworkPopupMode(): boolean {
    return window.innerWidth <= APP_CONFIG.networkQuality.participantPanel.popupBreakpointPx;
  }

  private renderParticipantNetwork(snapshot: ParticipantNetworkSnapshot) {
    if (!this.networkSidePanel || !this.networkPopupBody) return;
    const updated = new Date(snapshot.updatedAt).toLocaleTimeString();
    const content = this.renderParticipantNetworkRows(snapshot.rows);
    const html =
      `<div class="network-panel-title">Participant Network</div>` +
      `<div class="network-panel-updated">Updated: ${updated}</div>` +
      content;
    this.networkSidePanel.innerHTML = html;
    this.networkPopupBody.innerHTML = html;
  }

  private renderParticipantNetworkRows(rows: ParticipantNetworkRow[]): string {
    if (!rows || rows.length === 0) {
      return '<div class="network-empty">Pending stats...</div>';
    }
    return rows.map((row) => this.renderParticipantNetworkRow(row)).join("");
  }

  private renderParticipantNetworkRow(row: ParticipantNetworkRow): string {
    const label = this.escapeHtml(row.label || "Participant");
    const upload = this.renderParticipantMetric("Upload", row.upload);
    const download = this.renderParticipantMetric("Download", row.download);
    const remoteUpload = this.renderParticipantMetric("Remote Upload", row.remoteUpload);
    const remoteDownload = this.renderParticipantMetric("Remote Download", row.remoteDownload);
    const quality = this.renderParticipantQualityGrid(row);

    return (
      `<div class="network-row">` +
      `<div class="network-row-header">${label}</div>` +
      `<div class="network-row-grid">` +
      upload + download + remoteUpload + remoteDownload +
      `</div>` +
      quality +
      this.renderSlowLinkSummary(row) +
      this.renderBottleneckSummary(row.likelyBottleneck) +
      `<div class="network-row-strip">` +
      `<span class="network-strip-seg ${this.tierClass(row.upload.tier)}"></span>` +
      `<span class="network-strip-seg ${this.tierClass(row.download.tier)}"></span>` +
      `<span class="network-strip-seg ${this.tierClass(row.remoteUpload.tier)}"></span>` +
      `<span class="network-strip-seg ${this.tierClass(row.remoteDownload.tier)}"></span>` +
      `</div>` +
      `<div class="network-strip-legend">U | D | RU | RD</div>` +
      `</div>`
    );
  }

  private renderBottleneckSummary(value: "You" | "Remote" | "Both" | "Unknown"): string {
    const cls =
      value === "You" ? "bneck-you" :
      value === "Remote" ? "bneck-remote" :
      value === "Both" ? "bneck-both" :
      "bneck-unknown";
    return `<div class="network-bottleneck ${cls}">Likely bottleneck: ${value}</div>`;
  }

  private renderSlowLinkSummary(row: ParticipantNetworkRow): string {
    const uplink = row.upload.slowLink || row.remoteDownload.slowLink;
    const downlink = row.download.slowLink || row.remoteUpload.slowLink;
    if (!uplink && !downlink) {
      return '<div class="network-slowlink network-slowlink-none">SlowLink: None</div>';
    }
    const parts: string[] = [];
    if (uplink) parts.push("Uplink");
    if (downlink) parts.push("Downlink");
    return `<div class="network-slowlink network-slowlink-active">SlowLink: ${parts.join(" + ")}</div>`;
  }

  private renderParticipantMetric(label: string, direction: ParticipantNetworkDirectionSnapshot): string {
    const cls = this.tierClass(direction.tier);
    const kbps = this.formatParticipantSpeed(direction.kbps);
    const slowTag = direction.slowLink ? " SlowLink" : "";
    return (
      `<div class="network-metric">` +
      `<div class="network-metric-label">${label}</div>` +
      `<div class="network-metric-value ${cls}">${kbps} (${direction.tier}${slowTag})</div>` +
      `</div>`
    );
  }

  private renderParticipantQualityGrid(row: ParticipantNetworkRow): string {
    const q = row.quality;
    const localRtt = this.renderParticipantQualityMetric(
      "Local RTT",
      q.localRttMs,
      "ms",
      this.classifyRttTier(q.localRttMs)
    );
    const localJitter = this.renderParticipantQualityMetric(
      "Local Jitter",
      q.localJitterMs,
      "ms",
      this.classifyJitterTier(q.localJitterMs)
    );
    const localLoss = this.renderParticipantQualityMetric(
      "Local Loss",
      q.localLossPct,
      "%",
      this.classifyLossTier(q.localLossPct)
    );
    const remoteRtt = this.renderParticipantQualityMetric(
      "Remote RTT",
      q.remoteRttMs,
      "ms",
      this.classifyRttTier(q.remoteRttMs)
    );
    const remoteJitter = this.renderParticipantQualityMetric(
      "Remote Jitter",
      q.remoteJitterMs,
      "ms",
      this.classifyJitterTier(q.remoteJitterMs)
    );
    const remoteLoss = this.renderParticipantQualityMetric(
      "Remote Loss",
      q.remoteLossPct,
      "%",
      this.classifyLossTier(q.remoteLossPct)
    );
    return (
      `<div class="network-row-grid network-row-grid-quality">` +
      localRtt + localJitter + localLoss + remoteRtt + remoteJitter + remoteLoss +
      `</div>`
    );
  }

  private renderParticipantQualityMetric(
    label: string,
    value: number | null,
    unit: "ms" | "%",
    tier: ParticipantNetworkTier
  ): string {
    const cls = this.tierClass(tier);
    const rendered = this.formatParticipantQualityValue(value, unit);
    return (
      `<div class="network-metric">` +
      `<div class="network-metric-label">${label}</div>` +
      `<div class="network-metric-value ${cls}">${rendered}${value !== null ? ` (${tier})` : ""}</div>` +
      `</div>`
    );
  }

  private classifyJitterTier(value: number | null): ParticipantNetworkTier {
    if (value === null || !Number.isFinite(value)) return "Pending";
    const goodMax = APP_CONFIG.networkQuality.thresholds.jitterGoodMs;
    const mediumMax = goodMax * 2;
    if (value <= goodMax) return "Good";
    if (value <= mediumMax) return "Medium";
    return "Low";
  }

  private classifyRttTier(value: number | null): ParticipantNetworkTier {
    if (value === null || !Number.isFinite(value)) return "Pending";
    const goodMax = APP_CONFIG.networkQuality.thresholds.rttGoodMs;
    const mediumMax = goodMax * 2;
    if (value <= goodMax) return "Good";
    if (value <= mediumMax) return "Medium";
    return "Low";
  }

  private classifyLossTier(value: number | null): ParticipantNetworkTier {
    if (value === null || !Number.isFinite(value)) return "Pending";
    const goodMax = APP_CONFIG.networkQuality.thresholds.lossGoodPct;
    const mediumMax = goodMax * 2;
    if (value <= goodMax) return "Good";
    if (value <= mediumMax) return "Medium";
    return "Low";
  }

  private formatParticipantQualityValue(value: number | null, unit: "ms" | "%"): string {
    if (value === null || !Number.isFinite(value)) return "Pending";
    return `${value.toFixed(1)} ${unit}`;
  }

  private formatParticipantSpeed(kbps: number | null): string {
    if (kbps === null || !Number.isFinite(kbps)) return "Pending";
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(2)} Mbps`;
    return `${kbps.toFixed(0)} kbps`;
  }

  private tierClass(tier: ParticipantNetworkTier): string {
    if (tier === "Good") return "tier-good";
    if (tier === "Medium") return "tier-medium";
    if (tier === "Low") return "tier-low";
    return "tier-pending";
  }

  private escapeHtml(text: string): string {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private setupParentBridge() {
    this.bridge.onCommand((cmd: any) => {
      switch (cmd.type) {
        case "START_CALL":
          if (this.lastCfg) {
            this.controller.join(this.lastCfg);
          } else {
            void this.autoJoin();
          }
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
          void this.startRecording("manual");
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

