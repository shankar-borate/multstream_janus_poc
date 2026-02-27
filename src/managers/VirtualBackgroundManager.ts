class VirtualBackgroundManager {
  private bg = new Image();
  private seg: any = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private srcCanvas: HTMLCanvasElement;
  private srcCtx: CanvasRenderingContext2D;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D;
  private inVideo: HTMLVideoElement;
  private running = false;
  private segInFlight = false;
  private srcStream: MediaStream | null = null;
  private outStream: MediaStream | null = null;
  private resolvedMaskMode: "normal" | "inverted" | null = null;
  private maskVotes = { normal: 0, inverted: 0 };
  private maskProbeFrames = 0;
  private sourceProvider: (() => Promise<MediaStream | null>) | null = null;
  private lastRecoverAttemptAt = 0;
  private readonly recoverCooldownMs = 1200;

  private bgUrl = this.getBgUrl();

  constructor(){
    this.bg.src = this.bgUrl;

    this.canvas = document.createElement("canvas");
    const c = this.canvas.getContext("2d");
    if(!c) throw new Error("No canvas 2d");
    this.ctx = c;

    this.srcCanvas = document.createElement("canvas");
    const sc = this.srcCanvas.getContext("2d");
    if(!sc) throw new Error("No source canvas 2d");
    this.srcCtx = sc;

    this.maskCanvas = document.createElement("canvas");
    const mc = this.maskCanvas.getContext("2d");
    if(!mc) throw new Error("No mask canvas 2d");
    this.maskCtx = mc;

    this.bgCanvas = document.createElement("canvas");
    const bc = this.bgCanvas.getContext("2d");
    if(!bc) throw new Error("No background canvas 2d");
    this.bgCtx = bc;

    this.inVideo = document.createElement("video");
    this.inVideo.autoplay = true;
    this.inVideo.playsInline = true;
    this.inVideo.muted = true;
    this.inVideo.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;";
  }

  setSourceProvider(provider: () => Promise<MediaStream | null>): void {
    this.sourceProvider = provider;
  }

  private getBgUrl(): string {
    try {
      return new URL("./virtual.jpeg", window.location.href).toString();
    } catch {
      return "./virtual.jpeg";
    }
  }

  private async ensureBgLoaded(): Promise<void> {
    const img = this.bg;
    const url = this.bgUrl;
    if (!img.src || img.src !== url) {
      img.src = url;
    }
    Logger.user(`VB background loading: ${img.src}`);
    if (img.complete && img.naturalWidth > 0) {
      Logger.user(`VB background already loaded: w=${img.naturalWidth} h=${img.naturalHeight}`);
      return;
    }
    await new Promise<void>((resolve) => {
      img.onload = () => {
        Logger.user(`VB background loaded OK: w=${img.naturalWidth} h=${img.naturalHeight}`);
        resolve();
      };
      img.onerror = () => {
        Logger.user(`VB background FAILED to load: ${img.src}`);
        resolve();
      };
    });
  }

  private cloneVideoOnlyStream(stream: MediaStream): MediaStream {
    const inputTrack = stream.getVideoTracks()[0];
    if (!inputTrack) {
      return new MediaStream();
    }
    const clonedTrack = inputTrack.clone();
    clonedTrack.enabled = inputTrack.enabled !== false;
    return new MediaStream([clonedTrack]);
  }

  private releaseSourceStream(): void {
    if (this.srcStream) {
      this.srcStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
    }
    this.srcStream = null;
    this.inVideo.srcObject = null;
  }

  private async prepareSourceStream(stream: MediaStream): Promise<void> {
    const cloned = this.cloneVideoOnlyStream(stream);
    const track = cloned.getVideoTracks()[0];
    if (!track) {
      throw new Error("Virtual background source video track unavailable");
    }

    this.releaseSourceStream();
    this.srcStream = cloned;
    this.inVideo.srcObject = cloned;
    if (typeof document !== "undefined" && document.body && !document.body.contains(this.inVideo)) {
      document.body.appendChild(this.inVideo);
    }

    await this.inVideo.play().catch((e:any)=>{
      if (e?.name === "AbortError") return;
      Logger.error("Virtual background input video play failed", e);
    });
  }

  private ensureSegmentation(): void {
    if (this.seg) return;
    this.seg = new SelfieSegmentation({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    });
    this.seg.setOptions({ modelSelection: 1 });
    this.seg.onResults((r: any) => this.onResults(r));
  }

  async enable(stream: MediaStream): Promise<MediaStream>{
    this.running = false;
    this.segInFlight = false;
    this.resolvedMaskMode = null;
    this.maskVotes.normal = 0;
    this.maskVotes.inverted = 0;
    this.maskProbeFrames = 0;

    await this.prepareSourceStream(stream);
    await this.ensureBgLoaded();
    this.ensureSegmentation();

    this.running = true;
    this.loop();
    this.outStream = this.canvas.captureStream(24);
    Logger.user("Virtual background enabled");
    Logger.setStatus("Virtual background enabled");
    return this.outStream;
  }

  disable(){
    this.running = false;
    this.segInFlight = false;
    this.outStream = null;
    this.releaseSourceStream();
    Logger.user("Virtual background disabled");
    Logger.setStatus("Virtual background disabled");
  }

  getSourceStream(){ return this.srcStream; }
  getOutputStream(){ return this.outStream; }

  private async tryRecoverSource(): Promise<void> {
    if (!this.sourceProvider) return;
    const now = Date.now();
    if (now - this.lastRecoverAttemptAt < this.recoverCooldownMs) return;
    this.lastRecoverAttemptAt = now;

    try {
      const next = await this.sourceProvider();
      const nextTrack = next?.getVideoTracks()[0];
      if (!next || !nextTrack || nextTrack.readyState !== "live") return;
      await this.prepareSourceStream(next);
      Logger.user("Virtual background source recovered");
    } catch (e: any) {
      Logger.error("Virtual background source recovery failed", e);
    }
  }

  private async loop(){
    while(this.running){
      if(this.inVideo.readyState >= 2){
        try {
          if (this.inVideo.paused) {
            await this.inVideo.play().catch(() => {});
          }
          const srcVideoTrack = this.srcStream?.getVideoTracks()[0] ?? null;
          if (!srcVideoTrack || srcVideoTrack.readyState !== "live") {
            await this.tryRecoverSource();
          } else {
            if (!srcVideoTrack.enabled) srcVideoTrack.enabled = true;

            // Always paint raw camera first so preview never goes black.
            const w = this.inVideo.videoWidth || 640;
            const h = this.inVideo.videoHeight || 480;
            this.ensureCanvasSizes(w, h);
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.clearRect(0, 0, w, h);
            this.ctx.drawImage(this.inVideo, 0, 0, w, h);

            // Kick segmentation in non-blocking mode to avoid loop freeze.
            if (!this.segInFlight && this.seg) {
              this.segInFlight = true;
              void this.seg.send({ image: this.inVideo })
                .catch((e: any) => {
                  Logger.error("Virtual background segmentation frame failed", e);
                })
                .finally(() => {
                  this.segInFlight = false;
                });
            }
          }
        } catch (e: any) {
          Logger.error("Virtual background loop failed", e);
        }
      } else {
        await this.tryRecoverSource();
      }
      await new Promise(r=>setTimeout(r, 33));
    }
  }

  private ensureCanvasSizes(w: number, h: number): void {
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    if (this.srcCanvas.width !== w) this.srcCanvas.width = w;
    if (this.srcCanvas.height !== h) this.srcCanvas.height = h;
    if (this.maskCanvas.width !== w) this.maskCanvas.width = w;
    if (this.maskCanvas.height !== h) this.maskCanvas.height = h;
    if (this.bgCanvas.width !== w) this.bgCanvas.width = w;
    if (this.bgCanvas.height !== h) this.bgCanvas.height = h;
  }

  private onResults(results: any){
    if (!this.running) return;
    if(!results?.image || !results?.segmentationMask) return;

    const w = (results.image && results.image.width) || this.inVideo.videoWidth || 640;
    const h = (results.image && results.image.height) || this.inVideo.videoHeight || 480;
    if(!w || !h) return;
    this.ensureCanvasSizes(w, h);

    // If background not available, keep raw frame already rendered by loop.
    if(!(this.bg.complete && this.bg.naturalWidth > 0)){
      return;
    }

    try {
      this.srcCtx.clearRect(0, 0, w, h);
      this.srcCtx.drawImage(results.image, 0, 0, w, h);
      const srcData = this.srcCtx.getImageData(0, 0, w, h);

      this.maskCtx.clearRect(0, 0, w, h);
      this.maskCtx.drawImage(results.segmentationMask, 0, 0, w, h);
      const maskData = this.maskCtx.getImageData(0, 0, w, h);

      this.bgCtx.clearRect(0, 0, w, h);
      this.bgCtx.drawImage(this.bg, 0, 0, w, h);
      const bgData = this.bgCtx.getImageData(0, 0, w, h);

      const mode = this.getMaskMode(maskData, w, h);
      const out = this.ctx.createImageData(w, h);
      const src = srcData.data;
      const mask = maskData.data;
      const bg = bgData.data;
      const dst = out.data;

      for (let i = 0; i < dst.length; i += 4) {
        // Use alpha when available; otherwise fall back to luma from RGB mask.
        const alpha = mask[i + 3];
        const luma = (mask[i] + mask[i + 1] + mask[i + 2]) / 3;
        let m = alpha > 8 ? (alpha / 255) : (luma / 255);
        if (mode === "inverted") m = 1 - m;
        if (m < 0) m = 0;
        if (m > 1) m = 1;

        const inv = 1 - m;
        dst[i] = Math.round(src[i] * m + bg[i] * inv);
        dst[i + 1] = Math.round(src[i + 1] * m + bg[i + 1] * inv);
        dst[i + 2] = Math.round(src[i + 2] * m + bg[i + 2] * inv);
        dst[i + 3] = 255;
      }

      this.ctx.putImageData(out, 0, 0);
    } catch (e: any) {
      Logger.error("Virtual background composition failed", e);
    }
  }

  private getMaskMode(maskData: ImageData, w: number, h: number): "normal" | "inverted" {
    const configured = APP_CONFIG.virtualBackground.maskMode;
    if (configured === "normal" || configured === "inverted") return configured;
    if (this.resolvedMaskMode) return this.resolvedMaskMode;

    const centerPoints: Array<[number, number]> = [
      [0.5, 0.5],
      [0.45, 0.5],
      [0.55, 0.5],
      [0.5, 0.44],
      [0.5, 0.56]
    ];
    const edgePoints: Array<[number, number]> = [
      [0.08, 0.08],
      [0.5, 0.08],
      [0.92, 0.08],
      [0.08, 0.5],
      [0.92, 0.5],
      [0.08, 0.92],
      [0.5, 0.92],
      [0.92, 0.92]
    ];

    const center = this.sampleMaskSignal(maskData.data, centerPoints, w, h);
    const edge = this.sampleMaskSignal(maskData.data, edgePoints, w, h);
    const alphaDiff = center.alpha - edge.alpha;
    const lumaDiff = center.luma - edge.luma;
    const useAlpha = Math.abs(alphaDiff) >= Math.abs(lumaDiff);
    const diff = useAlpha ? alphaDiff : lumaDiff;
    const minDiff = APP_CONFIG.virtualBackground.maskAutoMinDiff;

    this.maskProbeFrames += 1;
    if (Math.abs(diff) >= minDiff) {
      const guess: "normal" | "inverted" = diff >= 0 ? "normal" : "inverted";
      this.maskVotes[guess] += 1;
      if (this.maskVotes[guess] >= APP_CONFIG.virtualBackground.maskAutoConfirmFrames) {
        this.resolvedMaskMode = guess;
        Logger.user(`VB mask mode auto-selected: ${guess}`);
        return this.resolvedMaskMode;
      }
      return guess;
    }

    if (this.maskProbeFrames >= APP_CONFIG.virtualBackground.maskAutoProbeFrames) {
      this.resolvedMaskMode = this.maskVotes.inverted > this.maskVotes.normal ? "inverted" : "normal";
      Logger.user(`VB mask mode auto-fallback: ${this.resolvedMaskMode}`);
      return this.resolvedMaskMode;
    }

    return this.maskVotes.inverted > this.maskVotes.normal ? "inverted" : "normal";
  }

  private sampleMaskSignal(
    rgba: Uint8ClampedArray,
    points: Array<[number, number]>,
    w: number,
    h: number
  ): { alpha: number; luma: number } {
    if (!points.length) return { alpha: 0, luma: 0 };
    let alphaSum = 0;
    let lumaSum = 0;
    points.forEach(([nx, ny]) => {
      const x = Math.max(0, Math.min(w - 1, Math.floor(nx * w)));
      const y = Math.max(0, Math.min(h - 1, Math.floor(ny * h)));
      const i = (y * w + x) * 4;
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      const a = rgba[i + 3];
      alphaSum += a;
      lumaSum += (r + g + b) / 3;
    });
    return {
      alpha: alphaSum / points.length,
      luma: lumaSum / points.length
    };
  }
}
