class VirtualBackgroundManager {
  private bg = new Image();
  private seg: any = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inVideo: HTMLVideoElement;
  private running = false;
  private srcStream: MediaStream | null = null;
  private outStream: MediaStream | null = null;

  // IMPORTANT: put virtual.jpeg next to index.html
  private bgUrl = this.getBgUrl();

  constructor(){
    // For local file (same origin), no crossOrigin needed
    this.bg.src = this.bgUrl;

    this.canvas = document.createElement("canvas");
    const c = this.canvas.getContext("2d");
    if(!c) throw new Error("No canvas 2d");
    this.ctx = c;

    this.inVideo = document.createElement("video");
    this.inVideo.autoplay = true;
    this.inVideo.playsInline = true;
    this.inVideo.muted = true;
  }

private getBgUrl(): string {
  // Same folder as index.html (works even with query params)
  // http://localhost/app/index.html?x=1 -> http://localhost/app/virtual.jpeg
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
      img.crossOrigin = "anonymous";
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

  async enable(stream: MediaStream): Promise<MediaStream>{
    this.srcStream = stream;
    this.inVideo.srcObject = stream;
    await this.inVideo.play().catch(()=>{});

    await this.ensureBgLoaded();

    if(!this.seg){
      this.seg = new SelfieSegmentation({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });
      this.seg.setOptions({ modelSelection: 1 });
      this.seg.onResults((r: any) => this.onResults(r));
    }

    this.running = true;
    this.loop();

    // 24 fps is OK for mobile; adjust if needed
    this.outStream = this.canvas.captureStream(24);
    Logger.user("Virtual background enabled");
    Logger.setStatus("Virtual background enabled");
    return this.outStream;
  }

  disable(){
    this.running = false;
    this.outStream = null;
    Logger.user("Virtual background disabled");
    Logger.setStatus("Virtual background disabled");
  }

  getSourceStream(){ return this.srcStream; }

  private async loop(){
    while(this.running){
      if(this.inVideo.readyState >= 2){
        await this.seg.send({ image: this.inVideo });
      }
      await new Promise(r=>setTimeout(r, 33));
    }
  }

  private onResults(results: any){
    const w = (results.image && results.image.width) || this.inVideo.videoWidth || 640;
    const h = (results.image && results.image.height) || this.inVideo.videoHeight || 480;
    if(!w || !h) return;

    if(this.canvas.width !== w) this.canvas.width = w;
    if(this.canvas.height !== h) this.canvas.height = h;

    const ctx = this.ctx;
    ctx.clearRect(0,0,w,h);

    // 1) Draw the camera frame
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(results.image, 0, 0, w, h);

    // 2) Keep ONLY the person using segmentation mask
    // segmentationMask: white = person, black = background
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(results.segmentationMask, 0, 0, w, h);

    // 3) Draw background BEHIND the person
    ctx.globalCompositeOperation = "destination-over";
    if(this.bg.complete && this.bg.naturalWidth > 0){
      ctx.drawImage(this.bg, 0, 0, w, h);
    } else {
      // fallback: dark fill if image not loaded
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0,0,w,h);
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
