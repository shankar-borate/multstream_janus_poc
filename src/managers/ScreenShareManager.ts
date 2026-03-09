class ScreenShareManager {
  private stream: MediaStream | null = null;

  async start(): Promise<MediaStream> {
    this.ensureSupported();

    const stream = await this.getDisplayStream();
    this.stream = stream;
    return this.stream;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  isSupported(): boolean {
    return this.getUnsupportedReason() === null;
  }

  getUnsupportedReason(): string | null {
    if (!window.isSecureContext) {
      return ErrorMessages.MEDIA_SCREEN_REQUIRES_SECURE_CONTEXT;
    }
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices || typeof mediaDevices.getDisplayMedia !== "function") {
      return this.isMobileDevice()
        ? ErrorMessages.MEDIA_SCREEN_UNSUPPORTED_MOBILE
        : ErrorMessages.MEDIA_SCREEN_UNSUPPORTED;
    }
    return null;
  }

  private ensureSupported(): void {
    const reason = this.getUnsupportedReason();
    if (!reason) return;
    throw this.buildNamedError(reason, /secure/i.test(reason) ? "SecurityError" : "NotSupportedError");
  }

  private async getDisplayStream(): Promise<MediaStream> {
    const mediaDevices = navigator.mediaDevices!;
    const videoConstraints: MediaTrackConstraints = {
      frameRate: { ideal: 15, max: 20 }
    };

    try {
      return await mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: true
      });
    } catch (e: any) {
      if (!this.shouldRetryVideoOnly(e)) {
        throw e;
      }
      Logger.warn("Display audio capture unavailable. Retrying screen share without system audio.");
      return mediaDevices.getDisplayMedia({
        video: videoConstraints
      });
    }
  }

  private shouldRetryVideoOnly(err: unknown): boolean {
    const name = MediaErrorUtils.getErrorName(err).toLowerCase();
    const message = MediaErrorUtils.getErrorMessage(err).toLowerCase();
    return name === "typeerror" ||
      name === "overconstrainederror" ||
      name === "constraintnotsatisfiederror" ||
      /audio|system audio|display audio/.test(message);
  }

  private isMobileDevice(): boolean {
    const ua = navigator.userAgent || "";
    const mobileUa = /Android|iPhone|iPad|iPod/i.test(ua);
    const iPadDesktopUa = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return mobileUa || iPadDesktopUa;
  }

  private buildNamedError(message: string, name: string): Error {
    const err = new Error(message) as Error & { name: string };
    err.name = name;
    return err;
  }
}
