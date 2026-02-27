class ScreenShareManager {
  private stream: MediaStream | null = null;

  async start(): Promise<MediaStream>{

    // Get screen share stream
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    // Get audio stream
    const mic = await navigator.mediaDevices.getUserMedia({
       audio: true
    });

    // combine streams
    mic.getAudioTracks().forEach(track =>
      stream.addTrack(track)
    );

    this.stream = stream;

    return this.stream;
  }

  stop(){
    if(this.stream){
      this.stream.getTracks().forEach(t=>t.stop());
      this.stream = null;
    }
  }

  getStream(): MediaStream | null {
    return this.stream;
  }
}
