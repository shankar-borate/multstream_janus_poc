class RemoteFeedManager {
  private feeds = new Map<number, any>();
  private feedTracks = new Map<number, Map<string, MediaStreamTrack>>();

  constructor(
    private janus:any,
    private roomId:number,
    private privateId:number,
    private opaqueId:string,
    private media:MediaManager,
    private remoteVideo:HTMLVideoElement
  ){}

  addFeed(feedId:number){
    if(this.feeds.has(feedId)) return;
    let remoteHandle:any = null;

    this.janus.attach({
      plugin:"janus.plugin.videoroom",
      opaqueId:this.opaqueId,
      success:(h:any)=>{
        remoteHandle=h;
        this.feeds.set(feedId,h);
        h.send({ message:{ request:"join", room:this.roomId, ptype:"subscriber", feed:feedId, private_id:this.privateId }});
      },
      error:(e:any)=>Logger.setStatus("Remote attach error: "+JSON.stringify(e)),
      onmessage:(msg:any,jsep:any)=>{
        if(jsep){
          remoteHandle.createAnswer({
            jsep,
            tracks:[{type:"audio",capture:false,recv:true},{type:"video",capture:false,recv:true}],
            success:(ans:any)=>remoteHandle.send({ message:{ request:"start", room:this.roomId }, jsep:ans }),
            error:(e:any)=>Logger.setStatus("Remote answer error: "+JSON.stringify(e))
          });
        }
      },
      onlocaltrack:()=>{},
      onremotetrack:(track:MediaStreamTrack,_mid:string,on:boolean)=>{
        let byId = this.feedTracks.get(feedId);
        if(!byId){
          byId = new Map<string, MediaStreamTrack>();
          this.feedTracks.set(feedId, byId);
        }

        if(!on){
          const prev = byId.get(track.id);
          if(prev){
            this.media.removeRemoteTrack(this.remoteVideo, prev);
            byId.delete(track.id);
          } else {
            this.media.removeRemoteTrack(this.remoteVideo, track);
          }
          return;
        }

        const existingSameKind = Array.from(byId.values()).find(t => t.kind === track.kind && t.id !== track.id);
        if(existingSameKind){
          this.media.removeRemoteTrack(this.remoteVideo, existingSameKind);
          byId.delete(existingSameKind.id);
        }

        byId.set(track.id, track);
        this.media.setRemoteTrack(this.remoteVideo, track);
      },
      oncleanup:()=>this.removeFeed(feedId, false)
    });
  }

  removeFeed(id:number, detach:boolean = true){
    const h = this.feeds.get(id);
    if(h){
      if(detach){
        try{h.detach();}catch{}
      }
      this.feeds.delete(id);
    }

    const tracks = this.feedTracks.get(id);
    if(tracks){
      tracks.forEach(t => this.media.removeRemoteTrack(this.remoteVideo, t));
      this.feedTracks.delete(id);
    }
  }

  cleanupAll(){
    Array.from(this.feeds.keys()).forEach(id => this.removeFeed(id, true));
    this.media.clearRemote(this.remoteVideo);
  }
}
