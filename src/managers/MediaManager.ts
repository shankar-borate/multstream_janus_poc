class MediaManager {
  private localPreviewStream: MediaStream | null = null;
  private remotePlayPromise: Promise<void> | null = null;
  private remoteGestureUnmuteBound = false;
  private remoteAutoplayBlocked = false;

  setLocalTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    if(!this.localPreviewStream) this.localPreviewStream = new MediaStream();
    this.localPreviewStream.getTracks().forEach(t=>this.localPreviewStream!.removeTrack(t));
    this.localPreviewStream.addTrack(track);
    video.srcObject = this.localPreviewStream;
    video.muted = true;
    video.play().catch((e: any) => {
      if (e?.name === "AbortError") return;
      Logger.error(ErrorMessages.MEDIA_LOCAL_VIDEO_PLAY_FAILED, e);
    });
  }

  setRemoteTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    const ms = (video.srcObject as MediaStream) || new MediaStream();
    video.autoplay = true;
    video.playsInline = true;
    // Keep one active track per kind for this single remote renderer.
    ms.getTracks().forEach(t=>{
      if(t.kind === track.kind && t.id !== track.id){
        ms.removeTrack(t);
        try{
          t.stop();
        }catch(e:any){
          Logger.error(ErrorMessages.MEDIA_STOP_REPLACED_REMOTE_TRACK_FAILED, e);
        }
      }
    });
    ms.addTrack(track);
    if (video.srcObject !== ms) {
      video.srcObject = ms;
    }

    this.ensureRemotePlayback(video);
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
    video.pause();
    video.srcObject = null;
  }

  private ensureRemotePlayback(video: HTMLVideoElement){
    if (!video.paused) return;
    if (this.remotePlayPromise) return;
    if (this.remoteAutoplayBlocked) {
      video.muted = true;
    }
    const playNormal = video.play();
    this.remotePlayPromise = playNormal;
    playNormal
      .then(() => {
        if (video.muted) {
          this.bindGestureUnmute(video);
        }
      })
      .catch((e: any) => {
        // Normal when track/srcObject is reloaded during renegotiation.
        if (e?.name === "AbortError") return;
        if (e?.name !== "NotAllowedError") {
          Logger.error(ErrorMessages.MEDIA_REMOTE_VIDEO_PLAY_FAILED, e);
          return;
        }

        this.remoteAutoplayBlocked = true;
        Logger.warn("Remote autoplay blocked. Retrying muted playback.");
        if (this.remotePlayPromise === playNormal) {
          this.remotePlayPromise = null;
        }
        if (!video.paused || this.remotePlayPromise !== null) return;
        video.muted = true;
        const playMuted = video.play();
        this.remotePlayPromise = playMuted;
        playMuted
          .then(() => this.bindGestureUnmute(video))
          .catch((inner: any) => {
            if (inner?.name === "AbortError") return;
            Logger.error(ErrorMessages.MEDIA_REMOTE_VIDEO_PLAY_FAILED, inner);
          })
          .finally(() => {
            if (this.remotePlayPromise === playMuted) {
              this.remotePlayPromise = null;
            }
          });
      })
      .finally(() => {
        if (this.remotePlayPromise === playNormal) {
          this.remotePlayPromise = null;
        }
      });
  }

  private bindGestureUnmute(video: HTMLVideoElement) {
    if (this.remoteGestureUnmuteBound) return;
    this.remoteGestureUnmuteBound = true;
    const tryUnmute = () => {
      if (!video.srcObject || !video.muted) return;
      video.muted = false;
      void video.play()
        .then(() => {
          this.remoteAutoplayBlocked = false;
        })
        .catch(() => {
          this.remoteAutoplayBlocked = true;
          video.muted = true;
        });
    };
    window.addEventListener("click", tryUnmute, { passive: true });
    window.addEventListener("touchstart", tryUnmute, { passive: true });
    window.addEventListener("keydown", tryUnmute);
  }
}
