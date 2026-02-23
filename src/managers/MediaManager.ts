class MediaManager {
  private localPreviewStream: MediaStream | null = null;

  setLocalTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    if(!this.localPreviewStream) this.localPreviewStream = new MediaStream();
    this.localPreviewStream.getTracks().forEach(t=>this.localPreviewStream!.removeTrack(t));
    this.localPreviewStream.addTrack(track);
    video.srcObject = this.localPreviewStream;
    video.muted = true;
    video.play().catch(()=>{});
  }

  setRemoteTrack(video: HTMLVideoElement, track: MediaStreamTrack){
    const ms = (video.srcObject as MediaStream) || new MediaStream();
    ms.addTrack(track);
    video.srcObject = ms;
    video.play().catch(()=>{});
  }

  clearLocal(video: HTMLVideoElement){
    const ms = video.srcObject as MediaStream | null;
    if(ms) ms.getTracks().forEach(t=>t.stop());
    video.srcObject = null;
    this.localPreviewStream = null;
  }

  clearRemote(video: HTMLVideoElement){
    const ms = video.srcObject as MediaStream | null;
    if(ms) ms.getTracks().forEach(t=>t.stop());
    video.srcObject = null;
  }
}
