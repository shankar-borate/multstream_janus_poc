class MediaManager {
  private localPreviewStream: MediaStream | null = null;
  private remotePlayPromise: Promise<void> | null = null;

  setLocalTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    if(!this.localPreviewStream) this.localPreviewStream = new MediaStream();
    this.localPreviewStream.getTracks().forEach(t=>this.localPreviewStream!.removeTrack(t));
    this.localPreviewStream.addTrack(track);
    video.srcObject = this.localPreviewStream;
    video.muted = true;
    video.play().catch((e: any) => {
      if (e?.name === "AbortError") return;
      Logger.error("Local video play failed", e);
    });
  }

  setRemoteTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    const ms = (video.srcObject as MediaStream) || new MediaStream();
    // Keep one active track per kind for this single remote renderer.
    ms.getTracks().forEach(t=>{
      if(t.kind === track.kind && t.id !== track.id){
        ms.removeTrack(t);
        try{
          t.stop();
        }catch(e:any){
          Logger.error("Stopping replaced remote track failed", e);
        }
      }
    });
    ms.addTrack(track);
    if (video.srcObject !== ms) {
      video.srcObject = ms;
    }

    if (!video.paused) return;
    if (this.remotePlayPromise) return;

    this.remotePlayPromise = video.play()
      .catch((e:any)=>{
        // Normal when track/srcObject is reloaded during renegotiation.
        if (e?.name === "AbortError") return;
        Logger.error("Remote video play failed", e);
      })
      .finally(() => {
        this.remotePlayPromise = null;
      });
  }

  removeRemoteTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    const ms = video.srcObject as MediaStream | null;
    if(!ms) return;

    ms.getTracks().forEach(t=>{
      if(t === track || t.id === track.id){
        ms.removeTrack(t);
      }
    });

    if(ms.getTracks().length === 0){
      video.srcObject = null;
    }
  }

  clearLocal(video: HTMLVideoElement){
    const ms = video.srcObject as MediaStream | null;
    if(ms) ms.getTracks().forEach(t=>t.stop());
    video.srcObject = null;
    this.localPreviewStream = null;
  }

  clearRemote(video: HTMLVideoElement){
    this.remotePlayPromise = null;
    const ms = video.srcObject as MediaStream | null;
    if(ms) ms.getTracks().forEach(t=>t.stop());
    video.srcObject = null;
  }
}
