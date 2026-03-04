type AdaptiveMode = "normal" | "low";
type AdaptiveVideoProfile = {
  width: number;
  height: number;
  maxFramerate: number;
  bitrateBps: number;
};
type AdaptiveNetworkManagerCallbacks = {
  onRiskSignal: (signal: NetworkRiskSignal) => void;
  onModeChanged: (mode: AdaptiveMode, videoCfg: VcxVideoConfig) => void | Promise<void>;
};

class AdaptiveNetworkManager {
  private mode: AdaptiveMode = "normal";
  private timer: number | null = null;
  private prevUpload = { bytes: 0, at: 0 };
  private lowSamples = 0;
  private recoverSamples = 0;
  private likelyDisconnectSamples = 0;
  private applyBusy = false;
  private defaultProfile: AdaptiveVideoProfile;

  constructor(
    private userType: "agent" | "customer",
    private callbacks: AdaptiveNetworkManagerCallbacks
  ) {
    this.defaultProfile = this.getFallbackProfile();
  }

  resetForJoin(payload?: MediaConstraintsPayload | null) {
    this.stop();
    this.mode = "normal";
    this.defaultProfile = this.resolveDefaultProfile(payload ?? null);
    this.emitRisk(null, false, "");
  }

  start(pc: RTCPeerConnection | null) {
    this.stop();
    if (!APP_CONFIG.adaptiveVideo.enabled || !pc) return;
    const intervalMs = Math.max(1000, APP_CONFIG.adaptiveVideo.sampleIntervalMs);
    this.timer = window.setInterval(() => {
      void this.sample(pc);
    }, intervalMs);
  }

  stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.prevUpload = { bytes: 0, at: 0 };
    this.lowSamples = 0;
    this.recoverSamples = 0;
    this.likelyDisconnectSamples = 0;
    this.applyBusy = false;
  }

  getParticipantSyncIntervalMs(): number {
    if (!APP_CONFIG.adaptiveVideo.enabled) return APP_CONFIG.call.participantSyncIntervalMs;
    return this.mode === "low"
      ? APP_CONFIG.adaptiveVideo.wsProtection.participantSyncIntervalMsLow
      : APP_CONFIG.adaptiveVideo.wsProtection.participantSyncIntervalMsNormal;
  }

  getVideoConfig(): VcxVideoConfig {
    const profile = this.getActiveProfile();
    const bitrateBps = Number.isFinite(profile.bitrateBps) ? Math.floor(profile.bitrateBps) : APP_CONFIG.media.bitrateBps;
    const maxFramerate = Number.isFinite(profile.maxFramerate) ? Math.floor(profile.maxFramerate) : APP_CONFIG.media.maxFramerate;
    return {
      bitrate_bps: Math.max(APP_CONFIG.media.minBitrateBps, Math.min(APP_CONFIG.media.maxBitrateBps, bitrateBps)),
      bitrate_cap: Boolean(APP_CONFIG.media.bitrateCap),
      max_framerate: Math.max(APP_CONFIG.media.minFramerate, Math.min(APP_CONFIG.media.maxFramerateCap, maxFramerate))
    };
  }

  getCameraProfileKey(): string {
    const profile = this.getActiveProfile();
    return `${this.userType}:${this.mode}:${profile.width}x${profile.height}@${profile.maxFramerate}`;
  }

  buildCameraConstraints(
    orientation: "portrait" | "landscape",
    isIOS: boolean
  ): MediaTrackConstraints {
    const profile = this.getActiveProfile();
    let width = profile.width;
    let height = profile.height;
    if (isIOS) {
      if (orientation === "portrait" && width > height) {
        [width, height] = [height, width];
      } else if (orientation === "landscape" && height > width) {
        [width, height] = [height, width];
      }
    }
    return {
      facingMode: "user",
      width: { ideal: width, max: width },
      height: { ideal: height, max: height },
      frameRate: { ideal: profile.maxFramerate, max: profile.maxFramerate }
    };
  }

  private getActiveProfile(): AdaptiveVideoProfile {
    if (!APP_CONFIG.adaptiveVideo.enabled || this.mode === "normal") {
      return this.defaultProfile;
    }

    const low = APP_CONFIG.adaptiveVideo.profiles[this.userType].low;
    if (this.userType === "agent") {
      return {
        width: low.width,
        height: low.height,
        maxFramerate: low.maxFramerate,
        bitrateBps: low.bitrateBps
      };
    }

    return {
      width: this.defaultProfile.width,
      height: this.defaultProfile.height,
      maxFramerate: low.maxFramerate,
      bitrateBps: low.bitrateBps
    };
  }

  private async sample(pc: RTCPeerConnection): Promise<void> {
    if (!APP_CONFIG.adaptiveVideo.enabled) return;
    const uploadKbps = await this.getUploadKbps(pc);
    if (uploadKbps === null) {
      this.emitRisk(null, false, "Pending");
      return;
    }

    const cfg = APP_CONFIG.adaptiveVideo;
    if (uploadKbps <= cfg.likelyDisconnectKbps) {
      this.likelyDisconnectSamples += 1;
    } else {
      this.likelyDisconnectSamples = 0;
    }

    let nextMode: AdaptiveMode = this.mode;
    if (this.mode === "normal") {
      if (uploadKbps <= cfg.lowEnterKbps) {
        this.lowSamples += 1;
      } else {
        this.lowSamples = 0;
      }
      this.recoverSamples = 0;
      if (this.lowSamples >= cfg.lowEnterSamples) {
        nextMode = "low";
      }
    } else {
      if (uploadKbps >= cfg.lowExitKbps) {
        this.recoverSamples += 1;
      } else {
        this.recoverSamples = 0;
      }
      if (this.recoverSamples >= cfg.lowExitSamples) {
        nextMode = "normal";
      }
    }

    if (nextMode !== this.mode) {
      await this.applyMode(nextMode);
    }

    const likelyDisconnect = this.likelyDisconnectSamples >= cfg.likelyDisconnectSamples;
    const modeMessage = this.mode === "low" ? "Low bandwidth mode active" : "Network normal";
    this.emitRisk(uploadKbps, likelyDisconnect, likelyDisconnect ? "Likely disconnect due to very low upload" : modeMessage);
  }

  private async applyMode(nextMode: AdaptiveMode): Promise<void> {
    if (nextMode === this.mode || this.applyBusy) return;
    this.applyBusy = true;
    try {
      this.mode = nextMode;
      this.lowSamples = 0;
      this.recoverSamples = 0;
      await this.callbacks.onModeChanged(this.mode, this.getVideoConfig());
    } finally {
      this.applyBusy = false;
    }
  }

  private emitRisk(uploadKbps: number | null, likelyDisconnect: boolean, message: string) {
    this.callbacks.onRiskSignal({
      mode: this.mode,
      uploadKbps,
      likelyDisconnect,
      message
    } as NetworkRiskSignal);
  }

  private async getUploadKbps(pc: RTCPeerConnection): Promise<number | null> {
    try {
      const report = await pc.getStats();
      let bytesTotal = 0;
      let found = false;
      report.forEach((s: any) => {
        if (s.type !== "outbound-rtp" || s.isRemote) return;
        const kind = s.kind || s.mediaType;
        if (kind !== "video") return;
        const bytes = Number(s.bytesSent);
        if (!Number.isFinite(bytes)) return;
        bytesTotal += bytes;
        found = true;
      });

      if (!found) {
        report.forEach((s: any) => {
          if (s.type !== "outbound-rtp" || s.isRemote) return;
          const bytes = Number(s.bytesSent);
          if (!Number.isFinite(bytes)) return;
          bytesTotal += bytes;
          found = true;
        });
      }
      if (!found) return null;

      const now = Date.now();
      if (this.prevUpload.at <= 0 || bytesTotal < this.prevUpload.bytes) {
        this.prevUpload = { bytes: bytesTotal, at: now };
        return null;
      }
      const deltaBytes = bytesTotal - this.prevUpload.bytes;
      const deltaMs = now - this.prevUpload.at;
      this.prevUpload = { bytes: bytesTotal, at: now };
      if (deltaMs <= 0) return null;
      return (deltaBytes * 8) / deltaMs;
    } catch {
      return null;
    }
  }

  private resolveDefaultProfile(payload: MediaConstraintsPayload | null): AdaptiveVideoProfile {
    const fallback = this.getFallbackProfile();
    if (!payload) return fallback;

    const isMobile = this.isMobileDevice();
    const picked = pickMediaConstraints(payload, isMobile);
    const pickedVideo = picked?.video;

    const chimeRole = this.userType === "agent" ? "employee" : "customer";
    const chimeNode = (payload.chimeMediaConstraints as any)?.[chimeRole]?.[isMobile ? "mobile" : "desktop"] ?? null;

    const width =
      this.readNumericConstraint((pickedVideo as any)?.width) ??
      this.readNumericConstraint((chimeNode as any)?.width) ??
      fallback.width;
    const height =
      this.readNumericConstraint((pickedVideo as any)?.height) ??
      this.readNumericConstraint((chimeNode as any)?.height) ??
      fallback.height;
    const maxFramerate =
      this.readNumericConstraint((pickedVideo as any)?.frameRate) ??
      this.readNumericConstraint((chimeNode as any)?.frameRate) ??
      fallback.maxFramerate;
    const bitrateBps = this.readNumericConstraint((payload as any)?.videochat?.videoBandwidth) ?? fallback.bitrateBps;

    return {
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
      maxFramerate: Math.max(APP_CONFIG.media.minFramerate, Math.floor(maxFramerate)),
      bitrateBps: Math.max(APP_CONFIG.media.minBitrateBps, Math.floor(bitrateBps))
    };
  }

  private getFallbackProfile(): AdaptiveVideoProfile {
    const normal = APP_CONFIG.adaptiveVideo.profiles[this.userType].normal;
    return {
      width: Math.max(1, Math.floor(normal.width)),
      height: Math.max(1, Math.floor(normal.height)),
      maxFramerate: Math.max(APP_CONFIG.media.minFramerate, Math.floor(APP_CONFIG.media.maxFramerate)),
      bitrateBps: Math.max(APP_CONFIG.media.minBitrateBps, Math.floor(APP_CONFIG.media.bitrateBps))
    };
  }

  private readNumericConstraint(value: any): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "object" || !value) return null;
    const keys = ["exact", "ideal", "max", "min"];
    for (const key of keys) {
      const candidate = (value as any)[key];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private isMobileDevice(): boolean {
    const ua = navigator.userAgent || "";
    const mobileUa = /Android|iPhone|iPad|iPod/i.test(ua);
    const iPadDesktopUa = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return mobileUa || iPadDesktopUa;
  }
}
