class MediaManager {
  private localPreviewStream: MediaStream | null = null;
  private remoteVideoStream = new MediaStream();
  private remoteAudioStream = new MediaStream();
  private remoteVideoPlayPromise: Promise<void> | null = null;
  private remoteAudioPlayPromise: Promise<void> | null = null;
  private remotePlaybackGestureBound = false;
  private remoteVideoEl: HTMLVideoElement | null = null;

  constructor(private remoteAudioEl: HTMLAudioElement | null = null) {
    this.bindRemotePlaybackActivation();
    this.configureRemoteAudioElement();
  }

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
    this.configureRemoteVideoElement(video);
    this.configureRemoteAudioElement();

    if (track.kind === "audio") {
      this.replaceRemoteTrackInStream(this.remoteAudioStream, track);
      this.ensureRemoteAudioPlayback();
      return;
    }

    this.replaceRemoteTrackInStream(this.remoteVideoStream, track);
    this.ensureRemoteVideoPlayback(video);
  }

  removeRemoteTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    this.configureRemoteVideoElement(video);
    this.configureRemoteAudioElement();

    if (track.kind === "audio") {
      this.removeRemoteTrackFromStream(this.remoteAudioStream, track);
      if (this.remoteAudioStream.getAudioTracks().length === 0) {
        this.remoteAudioEl?.pause();
      }
      return;
    }

    this.removeRemoteTrackFromStream(this.remoteVideoStream, track);
    if (this.remoteVideoStream.getVideoTracks().length === 0) {
      video.pause();
    }
  }

  clearLocal(video: HTMLVideoElement){
    const ms = video.srcObject as MediaStream | null;
    if(ms) ms.getTracks().forEach(t=>t.stop());
    video.srcObject = null;
    this.localPreviewStream = null;
  }

  clearRemote(video: HTMLVideoElement){
    this.remoteVideoPlayPromise = null;
    this.remoteAudioPlayPromise = null;
    this.configureRemoteVideoElement(video);
    this.configureRemoteAudioElement();
    this.clearStreamTracks(this.remoteVideoStream);
    this.clearStreamTracks(this.remoteAudioStream);
    video.pause();
    this.remoteAudioEl?.pause();
  }

  private configureRemoteVideoElement(video: HTMLVideoElement) {
    this.remoteVideoEl = video;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    if (video.srcObject !== this.remoteVideoStream) {
      video.srcObject = this.remoteVideoStream;
    }
  }

  private configureRemoteAudioElement() {
    if (!this.remoteAudioEl) return;
    this.remoteAudioEl.autoplay = true;
    this.remoteAudioEl.muted = false;
    (this.remoteAudioEl as any).playsInline = true;
    if (this.remoteAudioEl.srcObject !== this.remoteAudioStream) {
      this.remoteAudioEl.srcObject = this.remoteAudioStream;
    }
  }

  private replaceRemoteTrackInStream(stream: MediaStream, track: MediaStreamTrack) {
    stream.getTracks().forEach((existing: MediaStreamTrack) => {
      if (existing.kind === track.kind && existing.id !== track.id) {
        stream.removeTrack(existing);
      }
    });
    if (!stream.getTracks().some((existing: MediaStreamTrack) => existing.id === track.id)) {
      stream.addTrack(track);
    }
  }

  private removeRemoteTrackFromStream(stream: MediaStream, track: MediaStreamTrack) {
    stream.getTracks().forEach((existing: MediaStreamTrack) => {
      if (existing === track || existing.id === track.id) {
        stream.removeTrack(existing);
      }
    });
  }

  private clearStreamTracks(stream: MediaStream) {
    stream.getTracks().forEach((track: MediaStreamTrack) => {
      stream.removeTrack(track);
    });
  }

  private ensureRemoteVideoPlayback(video: HTMLVideoElement){
    if (this.remoteVideoStream.getVideoTracks().length === 0) return;
    this.primeRemoteVideoPlayback(video);
  }

  private ensureRemoteAudioPlayback() {
    if (this.remoteAudioStream.getAudioTracks().length === 0) return;
    this.primeRemoteAudioPlayback();
  }

  private primeRemoteVideoPlayback(video: HTMLVideoElement) {
    if (!video.paused) return;
    if (this.remoteVideoPlayPromise) return;
    const playRemoteVideo = video.play();
    this.remoteVideoPlayPromise = playRemoteVideo;
    playRemoteVideo
      .catch((e: any) => {
        if (e?.name === "AbortError" || e?.name === "NotSupportedError") return;
        Logger.error(ErrorMessages.MEDIA_REMOTE_VIDEO_PLAY_FAILED, e);
      })
      .finally(() => {
        if (this.remoteVideoPlayPromise === playRemoteVideo) {
          this.remoteVideoPlayPromise = null;
        }
      });
  }

  private primeRemoteAudioPlayback() {
    const audio = this.remoteAudioEl;
    if (!audio) return;
    if (!audio.paused) return;
    if (this.remoteAudioPlayPromise) return;
    const playRemoteAudio = audio.play();
    this.remoteAudioPlayPromise = playRemoteAudio;
    playRemoteAudio
      .catch((e: any) => {
        if (e?.name === "AbortError" || e?.name === "NotSupportedError") return;
        if (e?.name === "NotAllowedError") {
          Logger.warn("Remote audio autoplay blocked. Waiting for user interaction.");
          return;
        }
        Logger.error(ErrorMessages.MEDIA_REMOTE_AUDIO_PLAY_FAILED, e);
      })
      .finally(() => {
        if (this.remoteAudioPlayPromise === playRemoteAudio) {
          this.remoteAudioPlayPromise = null;
        }
      });
  }

  private bindRemotePlaybackActivation() {
    if (this.remotePlaybackGestureBound) return;
    this.remotePlaybackGestureBound = true;
    const activate = () => {
      if (this.remoteVideoEl) {
        this.primeRemoteVideoPlayback(this.remoteVideoEl);
      }
      this.primeRemoteAudioPlayback();
    };
    window.addEventListener("click", activate, { passive: true });
    window.addEventListener("touchstart", activate, { passive: true });
    window.addEventListener("keydown", activate);
  }
}
