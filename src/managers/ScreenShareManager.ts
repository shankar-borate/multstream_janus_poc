class ScreenShareManager {
  private stream: MediaStream | null = null;

  async start(): Promise<MediaStream>{
    this.stream = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:false });
    return this.stream;
  }

  stop(){
    if(this.stream){
      this.stream.getTracks().forEach(t=>t.stop());
      this.stream = null;
    }
  }
}
