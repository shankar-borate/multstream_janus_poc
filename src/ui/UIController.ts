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
  private btnHold = document.getElementById("btnHold") as HTMLButtonElement;
  private btnSwapCamera = document.getElementById("btnSwapCamera") as HTMLButtonElement;
  private btnLeave = document.getElementById("btnLeave") as HTMLButtonElement;
  private btnReconnect = document.getElementById("btnReconnect") as HTMLButtonElement;
  private btnScreen = document.getElementById("btnScreen") as HTMLButtonElement;
  private btnVB = document.getElementById("btnVB") as HTMLButtonElement;
  private btnScreenshot = document.getElementById("btnScreenshot") as HTMLButtonElement;

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
  private remoteFallbackDefault = document.getElementById("remoteFallbackDefault") as HTMLDivElement;
  private remoteHoldBackdrop = document.getElementById("remoteHoldBackdrop") as HTMLDivElement;

  private localOverlay = document.getElementById("localOverlay") as HTMLDivElement;
  private remoteOverlay = document.getElementById("remoteOverlay") as HTMLDivElement;
  private endedOverlay = document.getElementById("endedOverlay") as HTMLDivElement;
  private screenshotDialog = document.getElementById("screenshotDialog") as HTMLDivElement;
  private screenshotPreviewImage = document.getElementById("screenshotPreviewImage") as HTMLImageElement;
  private screenshotDialogSubtitle = document.getElementById("screenshotDialogSubtitle") as HTMLDivElement;
  private btnScreenshotCancel = document.getElementById("btnScreenshotCancel") as HTMLButtonElement;

  private localQ = document.getElementById("localQuality") as HTMLDivElement;
  private remoteQ = document.getElementById("remoteQuality") as HTMLDivElement;
  private localQD = document.getElementById("localQualityDetails") as HTMLDivElement;
  private remoteQD = document.getElementById("remoteQualityDetails") as HTMLDivElement;
  private networkSidePanel = document.getElementById("networkSidePanel") as HTMLDivElement;
  private networkSideHead = document.getElementById("networkSideHead") as HTMLDivElement;
  private networkSideToggle = document.getElementById("networkSideToggle") as HTMLSpanElement;
  private networkSideUpdated = document.getElementById("networkSideUpdated") as HTMLDivElement;
  private networkSideBody = document.getElementById("networkSideBody") as HTMLDivElement;
  private networkPanelBtn = document.getElementById("networkPanelBtn") as HTMLButtonElement;
  private networkPanelPopup = document.getElementById("networkPanelPopup") as HTMLDivElement;
  private networkPopupCard = document.getElementById("networkPopupCard") as HTMLDivElement;
  private networkPopupHead = document.getElementById("networkPopupHead") as HTMLDivElement;
  private networkPopupToggle = document.getElementById("networkPopupToggle") as HTMLButtonElement;
  private networkPanelClose = document.getElementById("networkPanelClose") as HTMLButtonElement;
  private networkPopupUpdated = document.getElementById("networkPopupUpdated") as HTMLDivElement;
  private networkPopupBody = document.getElementById("networkPopupBody") as HTMLDivElement;
  private diagPanel = document.getElementById("diagPanel") as HTMLDivElement;
  private diagPanelHead = document.getElementById("diagPanelHead") as HTMLDivElement;
  private diagPanelToggle = document.getElementById("diagPanelToggle") as HTMLSpanElement;
  private diagPerspective = document.getElementById("diagPerspective") as HTMLDivElement;
  private diagPanelBtn = document.getElementById("diagPanelBtn") as HTMLButtonElement;
  private diagPanelClose = document.getElementById("diagPanelClose") as HTMLButtonElement;
  private callMeta = document.getElementById("callMeta") as HTMLDivElement;
  private audioInputHud = document.getElementById("audioInputHud") as HTMLDivElement;
  private audioInputHudIcon = document.getElementById("audioInputHudIcon") as HTMLDivElement;
  private audioInputHudLabel = document.getElementById("audioInputHudLabel") as HTMLDivElement;
  private diagAudioInputCard = document.getElementById("diagAudioInputCard") as HTMLDivElement;
  private diagAudioInputLabel = document.getElementById("diagAudioInputLabel") as HTMLDivElement;
  private diagAudioInputDetail = document.getElementById("diagAudioInputDetail") as HTMLDivElement;
  private diagAudioSent = document.getElementById("diagAudioSent") as HTMLSpanElement;
  private diagAudioRecv = document.getElementById("diagAudioRecv") as HTMLSpanElement;
  private diagVideoSent = document.getElementById("diagVideoSent") as HTMLSpanElement;
  private diagVideoRecv = document.getElementById("diagVideoRecv") as HTMLSpanElement;
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
  private latestMediaIo: MediaIoSnapshot | null = null;
  private latestNetworkRisk: NetworkRiskSignal | null = null;
  private latestConnectivity: {
    ice: string;
    signaling: string;
    connection: string;
    gathering: string;
    ts: number;
  } | null = null;
  private activeAudioInput: ActiveAudioInputInfo = {
    label: "Microphone inactive",
    detail: "Start a call to see the active input.",
    deviceId: null,
    source: "unavailable"
  };

  private audioMuted = false;
  private videoMuted = false;
  private holdEnabled = false;
  private remoteHoldActive = false;
  private joined = false;
  private cameraFacingMode: "user" | "environment" = "user";
  private ended = false;
  private readonly userType = this.resolveUserType();
  private readonly canRecord = this.userType === "agent";
  private readonly canSwapCamera = this.userType === "customer";

  // ✅ recording state
  private recording = false;
  private renderedParticipantCount = 0;
  private lastRemoteVideoTime = 0;
  private remoteVideoFrameProgressAt = 0;
  private connectionStatus: ConnectionStatusView | null = null;
  private remoteVideoMonitorTimer: number | null = null;
  private diagPanelMinimized = false;
  private networkSidePanelMinimized = false;
  private networkPopupMinimized = false;

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
    this.applySwapCameraAccess();
    this.updateScreenshotUiCopy();
    this.updateHoldUI();
    this.updateSwapCameraButton();
    this.applyHoldControlState();
    this.renderAudioInputInfo();

    this.bus.on<boolean>("joined", j=>{
        this.joined = j;
        this.setJoinedState(j);
        if (j) {
          this.cameraFacingMode = this.controller.getCameraFacingMode();
          this.updateSwapCameraButton();
        }
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
      this.renderAudioInputInfo();
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
    this.bus.on<boolean>("hold-changed", onHold => {
      this.holdEnabled = onHold;
      this.updateHoldUI();
      this.applyHoldControlState();
      this.applyConnectionOverlays();
      this.renderRemoteFallback();
      this.updateDebugState({
        onHold
      });
      this.bridge.emit({
        type: "HOLD_CHANGED",
        onHold
      });
    });
    this.bus.on<boolean>("remote-hold-changed", onHold => {
      this.remoteHoldActive = onHold;
      this.applyConnectionOverlays();
      this.renderRemoteFallback();
      this.updateDebugState({
        remoteOnHold: onHold
      });
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
    this.bus.on<ActiveAudioInputInfo>("audio-input-info", (info) => {
      this.activeAudioInput = info;
      this.renderAudioInputInfo();
      this.updateDebugState({
        activeAudioInput: info.label,
        activeAudioInputSource: info.source
      });
    });
    this.bus.on<any>("connectivity", (s) => {
        this.latestConnectivity = s;
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
      this.latestMediaIo = stats;
      if (this.connectionStatus) {
        this.renderConnectionStatus(this.connectionStatus);
      }
    });
    this.bus.on<NetworkRiskSignal>("network-risk", (signal) => {
      this.latestNetworkRisk = signal;
      if (this.connectionStatus) {
        this.renderConnectionStatus(this.connectionStatus);
      }
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
    this.setupDiagnosticsPanel();
    this.setupParticipantNetworkPanel();
    this.setupParentBridge();
    this.setupScreenshotDialog();
    this.setupRemoteFallbackMonitor();
    this.bindBrowserNetworkState();
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

    this.btnHold.onclick = async () => {
      Logger.user("Hold button clicked");
      if (this.btnHold.disabled) return;
      this.btnHold.disabled = true;
      try {
        this.holdEnabled = await this.controller.toggleHold();
      } finally {
        this.applyHoldControlState();
      }
    };

    this.btnSwapCamera.onclick = async () => {
      Logger.user("Swap camera button clicked");
      if (this.btnSwapCamera.disabled) return;
      this.btnSwapCamera.disabled = true;
      try {
        this.cameraFacingMode = await this.controller.swapCameraFacingMode();
        this.updateSwapCameraButton();
      } finally {
        if (!this.ended) this.btnSwapCamera.disabled = false;
      }
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
    if (this.btnScreenshot) {
      this.btnScreenshot.onclick = () => {
        if (this.btnScreenshot.disabled) return;
        void this.previewLocalScreenshot();
      };
    }

    if (this.btnRecord) {
      this.btnRecord.onclick = () => {
        if (this.recording) {
          void this.stopRecording("manual");
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

  private applySwapCameraAccess() {
    if (!this.btnSwapCamera) return;
    if (this.canSwapCamera) return;
    this.btnSwapCamera.style.display = "none";
    this.btnSwapCamera.disabled = true;
  }

  private updateSwapCameraButton() {
    if (!this.btnSwapCamera) return;
    this.btnSwapCamera.title =
      this.cameraFacingMode === "user"
        ? "Switch to back camera"
        : "Switch to front camera";
  }

  private updateScreenshotUiCopy() {
    const targetLabel = this.userType === "agent" ? "remote" : "local";
    if (this.btnScreenshot) {
      this.btnScreenshot.title = `Capture ${targetLabel} screenshot`;
    }
    if (this.screenshotDialogSubtitle) {
      this.screenshotDialogSubtitle.textContent =
        this.userType === "agent"
          ? "Captured from the participant video."
          : "Captured from your local camera preview.";
    }
    if (this.screenshotPreviewImage) {
      this.screenshotPreviewImage.alt =
        this.userType === "agent"
          ? "Remote screenshot preview"
          : "Local screenshot preview";
    }
  }

  private updateHoldUI() {
    if (!this.btnHold) return;
    if (this.holdEnabled) {
      this.btnHold.classList.add("danger");
      this.btnHold.classList.remove("neutral");
      this.btnHold.innerHTML = '<i class="fa-solid fa-play"></i>';
      this.btnHold.title = "Resume Call";
      return;
    }
    this.btnHold.classList.remove("danger");
    this.btnHold.classList.add("neutral");
    this.btnHold.innerHTML = '<i class="fa-solid fa-pause"></i>';
    this.btnHold.title = "Put Call On Hold";
  }

  private applyHoldControlState() {
    const live = this.joined && !this.ended;
    const lockMediaControls = this.holdEnabled;
    const screenShareUnsupportedReason = this.controller.getScreenShareUnsupportedReason();

    if (this.btnMute) this.btnMute.disabled = !live || lockMediaControls;
    if (this.btnUnpublish) this.btnUnpublish.disabled = !live || lockMediaControls;
    if (this.btnSwapCamera) this.btnSwapCamera.disabled = !live || !this.canSwapCamera;
    if (this.btnScreen) {
      this.btnScreen.disabled = !live || lockMediaControls || !!screenShareUnsupportedReason;
      if (screenShareUnsupportedReason) {
        this.btnScreen.title = screenShareUnsupportedReason;
      }
    }
    if (this.btnVB) this.btnVB.disabled = !live || lockMediaControls;
    if (this.btnScreenshot) this.btnScreenshot.disabled = !live || lockMediaControls;
    if (this.btnReconnect) this.btnReconnect.disabled = !live;
    if (this.btnHold) this.btnHold.disabled = !live;
  }

  private syncAutoRecordingByParticipants(participantCount: number) {
    if (!this.canRecord) return;
    const requiredParticipants = APP_CONFIG.recording.autoStartParticipantThreshold;
    const shouldRecord = participantCount === requiredParticipants;

    if (shouldRecord && !this.recording) {
      void this.startRecording("auto");
      return;
    }

    if (participantCount < requiredParticipants && this.recording) {
      void this.stopRecording("auto");
    }
  }

  private async startRecording(source: "manual" | "auto") {
    await this.controller.startRecording(source, this.renderedParticipantCount);
  }

  private async stopRecording(source: "manual" | "auto") {
    try {
      await this.controller.stopRecording(source);
    } catch (e: any) {
      Logger.error(ErrorMessages.callRecordingLog(`ui stop failed source=${source}`), e);
    }
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

  private setupScreenshotDialog() {
    if (!this.screenshotDialog || !this.btnScreenshotCancel) return;
    this.btnScreenshotCancel.onclick = () => this.closeScreenshotPreview();
    this.screenshotDialog.onclick = (ev: MouseEvent) => {
      if (ev.target === this.screenshotDialog) {
        this.closeScreenshotPreview();
      }
    };
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && this.screenshotDialog.classList.contains("show")) {
        this.closeScreenshotPreview();
      }
    });
  }

  private closeScreenshotPreview() {
    if (!this.screenshotDialog) return;
    this.screenshotDialog.classList.remove("show");
    this.screenshotDialog.setAttribute("aria-hidden", "true");
    if (this.screenshotPreviewImage) {
      this.screenshotPreviewImage.src = "";
    }
  }

  private openScreenshotPreview(dataUrl: string) {
    if (!this.screenshotDialog || !this.screenshotPreviewImage) return;
    this.screenshotPreviewImage.src = dataUrl;
    this.screenshotDialog.classList.add("show");
    this.screenshotDialog.setAttribute("aria-hidden", "false");
  }

  private getScreenshotTarget(): {
    video: HTMLVideoElement;
    mirror: boolean;
    source: "local" | "remote";
  } {
    if (this.userType === "agent") {
      return {
        video: this.remoteVideoEl,
        mirror: false,
        source: "remote"
      };
    }
    return {
      video: this.localVideoEl,
      mirror: true,
      source: "local"
    };
  }

  private captureLocalScreenshotCanvas(): HTMLCanvasElement {
    const target = this.getScreenshotTarget();
    const video = target.video;
    const width = Math.max(0, Math.floor(video.videoWidth || 0));
    const height = Math.max(0, Math.floor(video.videoHeight || 0));
    if (
      !video.srcObject ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      width === 0 ||
      height === 0
    ) {
      throw new Error(ErrorMessages.callScreenshotUnavailable(target.source));
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error(ErrorMessages.CALL_SCREENSHOT_CANVAS_FAILED);
    }

    if (target.mirror) {
      // Mirror the local capture so it matches the local PiP preview.
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    return canvas;
  }

  private async canvasToByteArray(canvas: HTMLCanvasElement): Promise<number[]> {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error(ErrorMessages.CALL_SCREENSHOT_CAPTURE_FAILED));
      }, "image/png");
    });
    const buffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  }

  private async captureLocalScreenshot(): Promise<{
    byteArray: number[];
    dataUrl: string;
    mimeType: "image/png";
    width: number;
    height: number;
  }> {
    const canvas = this.captureLocalScreenshotCanvas();
    return {
      byteArray: await this.canvasToByteArray(canvas),
      dataUrl: canvas.toDataURL("image/png"),
      mimeType: "image/png",
      width: canvas.width,
      height: canvas.height
    };
  }

  private async previewLocalScreenshot() {
    try {
      const shot = await this.captureLocalScreenshot();
      this.openScreenshotPreview(shot.dataUrl);
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_SCREENSHOT_CAPTURE_FAILED, e);
      Logger.setStatus(String(e?.message || ErrorMessages.CALL_SCREENSHOT_CAPTURE_FAILED));
    }
  }

  private async handleParentScreenshot(cmd: any) {
    const responseType = cmd?.type === "TAKE_SCREENSHOT"
      ? "TAKE_SCREENSHOT_RESULT"
      : "TAKE_SCREENSHOOT_RESULT";
    const requestId = cmd?.requestId ?? cmd?.id ?? null;
    try {
      const shot = await this.captureLocalScreenshot();
      this.bridge.emit({
        type: responseType,
        ok: true,
        requestId,
        mimeType: shot.mimeType,
        width: shot.width,
        height: shot.height,
        byteArray: shot.byteArray
      });
    } catch (e: any) {
      Logger.error(ErrorMessages.CALL_SCREENSHOT_CAPTURE_FAILED, e);
      this.bridge.emit({
        type: responseType,
        ok: false,
        requestId,
        error: String(e?.message || ErrorMessages.CALL_SCREENSHOT_CAPTURE_FAILED)
      });
    }
  }

  private setEndedState(ended: boolean) {
    this.ended = ended;
    this.endedOverlay.style.display = ended ? "flex" : "none";
    this.renderRemoteFallback();
    this.applyHoldControlState();
    if (ended) {
      this.closeScreenshotPreview();
    }
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
    const meetingTo = req.guId;
    this.lastGroupId = req.groupId;
    this.controller.clearRecordingMeetingContext();
    this.recording = false;
    this.renderedParticipantCount = 0;
    this.lastRemoteVideoTime = 0;
    this.remoteVideoFrameProgressAt = 0;
    this.closeScreenshotPreview();
    this.updateRecordUI();
    this.renderCallMeta(req.display, req.participantId);

    Logger.setStatus(`Creating meeting... groupId=${req.groupId}, name=${req.display}${req.participantId ? `, participantId=${req.participantId}` : ""}`);
    Logger.user(`[rms] create meeting request groupId=${req.groupId}, to=${meetingTo}`);

    this.audioMuted = false;
    this.videoMuted = false;
    this.holdEnabled = false;
    this.remoteHoldActive = false;
    this.cameraFacingMode = "user";
    this.updateHoldUI();
    this.updateSwapCameraButton();
    this.setEndedState(false);
    this.applyConnectionOverlays();

    try {
      const roomId = await this.resolveMeetingRoomId(req.groupId, meetingTo);
      if (joinSeq !== this.autoJoinSeq) return;

      const cfg: JoinConfig = {
        server: req.server,
        roomId,
        display: req.display,
        participantId: req.participantId
      };
      this.lastCfg = cfg;
      this.controller.setRecordingMeetingContext(req.groupId, cfg.roomId, meetingTo);
      this.renderCallMeta(cfg.display, cfg.participantId, cfg.roomId);
      this.updateDebugState({
        groupId: req.groupId,
        guId: req.guId,
        meetingTo,
        roomId: cfg.roomId
      });

      Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}${cfg.participantId ? `, participantId=${cfg.participantId}` : ""}`);
      this.controller.join(cfg);
      this.bridge.emit({ type: "CALL_STARTED" });
    } catch (e: any) {
      if (joinSeq !== this.autoJoinSeq) return;
      ApiErrorUtils.handle(e);
    }
  }

  private async resolveMeetingRoomId(groupId: number, to: number): Promise<number> {
    const server = UrlConfig.getVcxServer().server;
    const clientId = UrlConfig.getVcxServer().client_id;
    const http = new HttpClient(server, clientId);
    const rms = new RmsClient(http);
    const meetingId = await rms.createMeetingByGroup(groupId, to);
    Logger.user(`[rms] meeting created groupId=${groupId}, to=${to} -> meetingId(roomId)=${meetingId}`);
    return meetingId;
  }

  private renderCallMeta(display: string, participantId?: number, roomId?: number) {
    if (!this.callMeta) return;
    const groupText = this.lastGroupId ?? "-";
    const roomText = Number.isFinite(roomId as number) ? String(roomId) : "Pending";
    this.callMeta.textContent =
      `GroupId: ${groupText} | RoomId: ${roomText} | Name: ${display}` +
      `${participantId ? ` | ParticipantId: ${participantId}` : ""}`;
    if (this.diagPerspective) {
      this.diagPerspective.textContent =
        `Perspective: You (${display}${participantId ? `, participantId: ${participantId}` : ""})`;
    }
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
    this.joined = joined;
    [
      this.btnMute,
      this.btnUnpublish,
      this.btnReconnect,
      this.btnScreen,
      this.btnVB,
      this.btnScreenshot
    ].forEach(b => b && (b.disabled = !joined));

    if (this.btnHold) {
      this.btnHold.disabled = !joined;
    }

    if (this.btnSwapCamera) {
      this.btnSwapCamera.disabled = !joined || !this.canSwapCamera;
    }

    this.btnLeave.disabled = this.ended ? false : !joined;

    if (this.btnRecord) {
      this.btnRecord.disabled = !joined || !this.canRecord;
    }

    this.applyHoldControlState();
  }

  private getLocalBaseOverlayText(): string {
    if (this.holdEnabled) return "on hold";
    if (this.videoMuted) return "video muted";
    if (this.audioMuted) return "audio muted";
    return "Local";
  }

  private getRemoteBaseOverlayText(): string {
    const remoteHoldVisual = this.remoteHoldActive && !this.holdEnabled;
    if (remoteHoldVisual) return "on hold";
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
    this.logger.setStatusBySeverity(resolved.primaryText, resolved.severity);
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
    if (navigator.onLine === false) {
      return this.overrideStatus(
        "SYSTEM",
        "error",
        "FAILED",
        "Your internet connection was lost.",
        "Reconnect to continue the call."
      );
    }

    const transportBlocked = this.getTransportBlockedStatus(status);
    if (transportBlocked) {
      return transportBlocked;
    }

    const failedOverride = this.getFailedStatusOverride(status);
    if (failedOverride) {
      return failedOverride;
    }

    const mediaFlowOverride = this.getMediaFlowStatusOverride(status);
    if (mediaFlowOverride) {
      return mediaFlowOverride;
    }

    const networkOverride = this.getNetworkStatusOverride(status);
    if (networkOverride) {
      return networkOverride;
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

  private overrideStatus(
    owner: ConnectionOwner,
    severity: ConnectionSeverity,
    state: ConnectionProductState,
    primaryText: string,
    secondaryText: string
  ): ConnectionStatusView {
    return { owner, severity, state, primaryText, secondaryText };
  }

  private getTransportBlockedStatus(status: ConnectionStatusView): ConnectionStatusView | null {
    const detail = `${status.primaryText} ${status.secondaryText}`.toLowerCase();
    const hasTurnBlockHint =
      detail.includes("turn server unreachable") ||
      detail.includes("stun/ice server unreachable") ||
      detail.includes("turn tls connection failed") ||
      detail.includes("turn authentication failed") ||
      detail.includes("dtls handshake failed") ||
      detail.includes("browser offline") ||
      detail.includes("firewall");

    if (!hasTurnBlockHint) {
      return null;
    }

    if (status.state === "PEER_RETRYING" || status.state === "RETRYING") {
      return this.overrideStatus(
        "SYSTEM",
        "warn",
        "PEER_RETRYING",
        "Secure media connection is blocked.",
        "Your network or firewall may be preventing the call from connecting."
      );
    }

    if (status.state === "FAILED") {
      return this.overrideStatus(
        "SYSTEM",
        "error",
        "FAILED",
        "Secure media connection is blocked.",
        "Your network or firewall may be preventing the call from connecting."
      );
    }

    return null;
  }

  private getFailedStatusOverride(status: ConnectionStatusView): ConnectionStatusView | null {
    if (status.state !== "FAILED" && status.severity !== "error") {
      return null;
    }

    const detail = `${status.primaryText} ${status.secondaryText}`.toLowerCase();
    if (
      detail.includes("permission") ||
      detail.includes("camera") ||
      detail.includes("microphone") ||
      detail.includes("mic") ||
      detail.includes("notallowederror")
    ) {
      return this.overrideStatus(
        "SYSTEM",
        "error",
        "FAILED",
        "Connection failed.",
        "Camera or microphone access is blocked. Allow access and reconnect."
      );
    }

    if (detail.includes("offline")) {
      return this.overrideStatus(
        "SYSTEM",
        "error",
        "FAILED",
        "Connection failed.",
        "Your internet connection appears to be offline."
      );
    }

    return this.overrideStatus(
      "SYSTEM",
      "error",
      "FAILED",
      "Connection failed.",
      "The media connection could not be established. Please reconnect."
    );
  }

  private getMediaFlowStatusOverride(status: ConnectionStatusView): ConnectionStatusView | null {
    const stats = this.latestMediaIo;
    if (!stats) return null;
    const canExplainConnectedMediaFlow =
      status.state === "CONNECTED" ||
      status.state === "DEGRADED" ||
      status.state === "LOCAL_SLOW" ||
      status.state === "REMOTE_SLOW" ||
      status.state === "OPTIMIZING";
    if (!canExplainConnectedMediaFlow) {
      return null;
    }

    if (stats.matrix.remoteReceivingYourVideo === "No" && !this.videoMuted) {
      return this.overrideStatus(
        "LOCAL",
        "warn",
        "DEGRADED",
        "The call is connected, but your video is not reaching the participant.",
        "We are retrying your media path now."
      );
    }

    if (stats.matrix.remoteReceivingYourAudio === "No" && !this.audioMuted) {
      return this.overrideStatus(
        "LOCAL",
        "warn",
        "DEGRADED",
        "The call is connected, but your audio is not reaching the participant.",
        "Check mute and network stability while we retry."
      );
    }

    if (stats.matrix.localVideoPlaybackStatus === "Stalled") {
      return this.overrideStatus(
        "REMOTE",
        "warn",
        "DEGRADED",
        "Video playback is stalled.",
        "Media may be arriving slowly or playback may be stuck. Retrying now."
      );
    }

    if (stats.matrix.localReceivingYourVideo === "No") {
      return this.overrideStatus(
        "REMOTE",
        "warn",
        "DEGRADED",
        "The call is connected, but the participant's video is not reaching you.",
        "Waiting for their browser or network to start sending video."
      );
    }

    if (stats.matrix.localReceivingYourAudio === "No") {
      return this.overrideStatus(
        "REMOTE",
        "warn",
        "DEGRADED",
        "The call is connected, but the participant's audio is not reaching you.",
        "Waiting for incoming audio to recover."
      );
    }

    return null;
  }

  private getNetworkStatusOverride(status: ConnectionStatusView): ConnectionStatusView | null {
    const risk = this.latestNetworkRisk;
    if (risk && (risk.likelyDisconnect || risk.mode === "low")) {
      return this.overrideStatus(
        "LOCAL",
        "warn",
        "LOCAL_SLOW",
        "Your network is slow.",
        "Video may take longer to connect. Try a stronger network or stop heavy downloads."
      );
    }

    if (status.state === "REMOTE_SLOW") {
      return this.overrideStatus(
        "REMOTE",
        "warn",
        "REMOTE_SLOW",
        "The participant's network is slow.",
        "Your connection is active. Waiting for their media to start."
      );
    }

    if (status.state === "DEGRADED" || status.state === "OPTIMIZING" || this.isConnectionStateUnstable()) {
      return this.overrideStatus(
        "SYSTEM",
        "warn",
        "DEGRADED",
        "The connection is unstable.",
        "We are trying a more stable route now."
      );
    }

    if (status.state === "RETRYING") {
      return this.overrideStatus(
        "SYSTEM",
        "warn",
        "RETRYING",
        "Reconnecting the call...",
        "Trying a new media route now."
      );
    }

    return null;
  }

  private isConnectionStateUnstable(): boolean {
    const connectivity = this.latestConnectivity;
    if (!connectivity) return false;
    const ice = String(connectivity.ice || "").toLowerCase();
    const connection = String(connectivity.connection || "").toLowerCase();
    return ice === "disconnected" || ice === "failed" || connection === "disconnected" || connection === "failed";
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

    const remoteHoldVisual = this.remoteHoldActive && !this.holdEnabled;
    const showFallback = !this.ended && (remoteHoldVisual || !this.hasRemoteVideoTrack());
    this.remoteFallback.style.display = showFallback ? "flex" : "none";
    if (this.remoteFallbackDefault) {
      this.remoteFallbackDefault.style.display =
        showFallback && !remoteHoldVisual ? "flex" : "none";
    }
    if (this.remoteHoldBackdrop) {
      this.remoteHoldBackdrop.style.display =
        showFallback && remoteHoldVisual ? "block" : "none";
    }
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

  private getAudioInputVisualState(): "active" | "pending" | "inactive" {
    const source = this.activeAudioInput?.source;
    if (source === "pending") return "pending";
    if (source === "unavailable") return "inactive";
    return "active";
  }

  private getAudioInputIconMarkup(state: "active" | "pending" | "inactive"): string {
    if (this.audioMuted) {
      return '<i class="fa-solid fa-microphone-slash"></i>';
    }
    if (state === "pending") {
      return '<i class="fa-solid fa-circle-notch"></i>';
    }
    if (state === "inactive") {
      return '<i class="fa-solid fa-microphone-slash"></i>';
    }
    return '<i class="fa-solid fa-microphone-lines"></i>';
  }

  private renderAudioInputInfo() {
    const info = this.activeAudioInput;
    const state = this.getAudioInputVisualState();
    const title = info.detail ? `${info.label}. ${info.detail}` : info.label;

    if (this.audioInputHud) {
      this.audioInputHud.classList.toggle("muted", this.audioMuted);
      this.audioInputHud.classList.toggle("pending", state === "pending");
      this.audioInputHud.classList.toggle("inactive", state === "inactive");
      this.audioInputHud.title = title;
      this.audioInputHud.setAttribute("aria-label", title);
    }

    if (this.audioInputHudIcon) {
      this.audioInputHudIcon.innerHTML = this.getAudioInputIconMarkup(state);
      this.audioInputHudIcon.setAttribute("aria-hidden", "true");
    }

    if (this.audioInputHudLabel) {
      this.audioInputHudLabel.textContent = info.label;
      this.audioInputHudLabel.title = info.label;
    }

    if (this.diagAudioInputCard) {
      this.diagAudioInputCard.classList.toggle("pending", state === "pending");
      this.diagAudioInputCard.classList.toggle("inactive", state === "inactive");
      this.diagAudioInputCard.title = title;
    }

    if (this.diagAudioInputLabel) {
      this.diagAudioInputLabel.textContent = info.label;
      this.diagAudioInputLabel.title = info.label;
    }

    if (this.diagAudioInputDetail) {
      this.diagAudioInputDetail.textContent = info.detail;
      this.diagAudioInputDetail.title = info.detail;
    }
  }

  private renderStatusBadge(el: HTMLElement, value: string) {
    const normalized = String(value || "").trim();
    let symbol = "\u2022";
    let color = "#6b7280";
    let bg = "#e2e8f0";
    let border = "#cbd5e1";

    if (normalized === "Yes" || normalized === "Active") {
      symbol = "\u2714";
      color = "#16a34a";
      bg = "#dcfce7";
      border = "#86efac";
    } else if (normalized === "No" || normalized === "Stalled" || normalized === "Not possible") {
      symbol = "\u2716";
      color = "#dc2626";
      bg = "#fee2e2";
      border = "#fca5a5";
    } else if (normalized === "Pending") {
      symbol = "\u2022";
      color = "#d97706";
      bg = "#fef3c7";
      border = "#fcd34d";
    }

    el.textContent = `${symbol} ${normalized}`;
    el.style.color = color;
    el.style.fontWeight = "700";
    el.style.display = "inline-flex";
    el.style.alignItems = "center";
    el.style.padding = "2px 8px";
    el.style.borderRadius = "999px";
    el.style.background = bg;
    el.style.border = `1px solid ${border}`;
  }

  private renderMediaIo(stats: MediaIoSnapshot) {
    this.latestMediaIo = stats;
    const prev = this.prevMediaBytes;
    const audioMinDeltaBytesSent = 64;
    const videoMinDeltaBytesSent = 512;
    const audioMinDeltaBytesRecv = APP_CONFIG.mediaTelemetry.minRecvAudioBytesPerSample;
    const videoMinDeltaBytesRecv = APP_CONFIG.mediaTelemetry.minRecvVideoBytesPerSample;
    const audioRecvBlocked =
      stats.matrix.localReceivingYourAudio === "No" ||
      stats.matrix.localReceivingYourAudio === "Not possible" ||
      stats.matrix.localAudioPlaybackStatus === "Stalled";
    const videoRecvBlocked =
      stats.matrix.localReceivingYourVideo === "No" ||
      stats.matrix.localReceivingYourVideo === "Not possible" ||
      stats.matrix.localVideoPlaybackStatus === "Stalled";

    const aSent = this.formatFlowBytes(stats.bytes.audioSent, prev?.audioSent ?? null, audioMinDeltaBytesSent, this.audioMuted);
    const aRecv = this.formatFlowBytes(
      stats.bytes.audioReceived,
      prev?.audioReceived ?? null,
      audioMinDeltaBytesRecv,
      audioRecvBlocked
    );
    const vSent = this.formatFlowBytes(stats.bytes.videoSent, prev?.videoSent ?? null, videoMinDeltaBytesSent, this.videoMuted);
    const vRecv = this.formatFlowBytes(
      stats.bytes.videoReceived,
      prev?.videoReceived ?? null,
      videoMinDeltaBytesRecv,
      videoRecvBlocked
    );
    this.renderFlowValue(this.diagAudioSent, aSent);
    this.renderFlowValue(this.diagAudioRecv, aRecv);
    this.renderFlowValue(this.diagVideoSent, vSent);
    this.renderFlowValue(this.diagVideoRecv, vRecv);

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

  private renderFlowValue(el: HTMLElement, flow: { text: string; color: string }) {
    if (!el) return;
    el.textContent = flow.text;
    el.style.color = flow.color;
    el.style.fontWeight = "700";
  }

  private setupDiagnosticsPanel() {
    if (
      !this.diagPanel ||
      !this.diagPanelHead ||
      !this.diagPanelToggle ||
      !this.diagPanelBtn ||
      !this.diagPanelClose
    ) {
      return;
    }
    const isMobile = () => window.innerWidth <= 900;
    const closeMobile = () => this.diagPanel.classList.remove("show-mobile");
    const applyMinimizedState = () => {
      this.diagPanel.classList.toggle("minimized", this.diagPanelMinimized);
      this.diagPanelToggle.textContent = this.diagPanelMinimized ? "+" : "-";
      this.diagPanelHead.setAttribute("aria-expanded", String(!this.diagPanelMinimized));
    };
    const toggleMinimized = () => {
      this.diagPanelMinimized = !this.diagPanelMinimized;
      applyMinimizedState();
    };

    this.diagPanelHead.onclick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (target?.closest("#diagPanelClose")) return;
      toggleMinimized();
    };
    this.diagPanelHead.onkeydown = (ev: KeyboardEvent) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      toggleMinimized();
    };

    this.diagPanelBtn.onclick = () => {
      if (!isMobile()) {
        toggleMinimized();
        return;
      }
      this.diagPanel.classList.toggle("show-mobile");
    };
    this.diagPanelClose.onclick = (ev: MouseEvent) => {
      ev.stopPropagation();
      closeMobile();
    };
    window.addEventListener("resize", () => {
      if (!isMobile()) closeMobile();
    });
    applyMinimizedState();
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

  private bindBrowserNetworkState() {
    const sync = () => {
      if (navigator.onLine === false) {
        Logger.setStatus(ErrorMessages.NETWORK_OFFLINE);
      }
    };
    window.addEventListener("offline", sync);
    window.addEventListener("online", () => {
      if (!this.joined || this.ended) return;
      Logger.setStatus("Back online. Reconnecting media if needed...");
    });
    sync();
  }

  private setupParticipantNetworkPanel() {
    if (
      !this.networkSidePanel ||
      !this.networkSideHead ||
      !this.networkSideToggle ||
      !this.networkSideUpdated ||
      !this.networkSideBody ||
      !this.networkPanelBtn ||
      !this.networkPanelPopup ||
      !this.networkPopupCard ||
      !this.networkPopupHead ||
      !this.networkPopupToggle ||
      !this.networkPopupUpdated ||
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
    const applySideMinimizedState = () => {
      this.networkSidePanel.classList.toggle("minimized", this.networkSidePanelMinimized);
      this.networkSideToggle.textContent = this.networkSidePanelMinimized ? "+" : "-";
      this.networkSideHead.setAttribute("aria-expanded", String(!this.networkSidePanelMinimized));
    };
    const applyPopupMinimizedState = () => {
      this.networkPopupCard.classList.toggle("minimized", this.networkPopupMinimized);
      this.networkPopupToggle.textContent = this.networkPopupMinimized ? "+" : "-";
      this.networkPopupHead.setAttribute("aria-expanded", String(!this.networkPopupMinimized));
      this.networkPopupToggle.setAttribute(
        "aria-label",
        this.networkPopupMinimized ? "Maximize network panel" : "Minimize network panel"
      );
    };
    const toggleSideMinimized = () => {
      this.networkSidePanelMinimized = !this.networkSidePanelMinimized;
      applySideMinimizedState();
    };
    const togglePopupMinimized = () => {
      this.networkPopupMinimized = !this.networkPopupMinimized;
      applyPopupMinimizedState();
    };

    this.networkPanelBtn.onclick = () => {
      if (!this.isParticipantNetworkPopupMode()) {
        toggleSideMinimized();
        return;
      }
      if (this.networkPanelPopup.classList.contains("show")) {
        closePopup();
      } else {
        openPopup();
      }
    };
    this.networkSideHead.onclick = () => toggleSideMinimized();
    this.networkSideHead.onkeydown = (ev: KeyboardEvent) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      toggleSideMinimized();
    };
    this.networkPopupHead.onclick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (target?.closest("#networkPanelClose") || target?.closest("#networkPopupToggle")) return;
      togglePopupMinimized();
    };
    this.networkPopupHead.onkeydown = (ev: KeyboardEvent) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      togglePopupMinimized();
    };
    this.networkPopupToggle.onclick = (ev: MouseEvent) => {
      ev.stopPropagation();
      togglePopupMinimized();
    };
    this.networkPanelClose.onclick = (ev: MouseEvent) => {
      ev.stopPropagation();
      closePopup();
    };
    this.networkPanelPopup.onclick = (ev: MouseEvent) => {
      if (ev.target === this.networkPanelPopup) closePopup();
    };
    window.addEventListener("resize", () => {
      if (!this.isParticipantNetworkPopupMode()) {
        closePopup();
      }
    });
    applySideMinimizedState();
    applyPopupMinimizedState();

    this.participantNet.start(
      (snapshot: ParticipantNetworkSnapshot) => this.renderParticipantNetwork(snapshot),
      () => this.controller.getParticipantNetworkPeers()
    );
  }

  private isParticipantNetworkPopupMode(): boolean {
    return window.innerWidth <= APP_CONFIG.networkQuality.participantPanel.popupBreakpointPx;
  }

  private renderParticipantNetwork(snapshot: ParticipantNetworkSnapshot) {
    if (
      !this.networkSideUpdated ||
      !this.networkSideBody ||
      !this.networkPopupUpdated ||
      !this.networkPopupBody
    ) {
      return;
    }
    const updated = new Date(snapshot.updatedAt).toLocaleTimeString();
    const content = this.renderParticipantNetworkRows(snapshot.rows);
    this.networkSideUpdated.textContent = `Updated: ${updated}`;
    this.networkPopupUpdated.textContent = `Updated: ${updated}`;
    this.networkSideBody.innerHTML = content;
    this.networkPopupBody.innerHTML = content;
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

        case "TOGGLE_HOLD":
          this.btnHold.click();
          break;

        case "TAKE_SCREENSHOOT":
        case "TAKE_SCREENSHOT":
          void this.handleParentScreenshot(cmd);
          break;

        case "RECONNECT":
          this.reconnect();
          break;

        // ✅ recording events
        case "START_RECORDING":
          void this.startRecording("manual");
          break;

        case "STOP_RECORDING":
          void this.stopRecording("manual");
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


