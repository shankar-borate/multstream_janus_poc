class RemoteFeedManager {
  private feeds = new Map<number, any>();
  private feedTracks = new Map<number, Map<string, MediaStreamTrack>>();

  constructor(
    private janus:any,
    private roomId:number,
    private privateId:number,
    private opaqueId:string,
    private media:MediaManager,
    private remoteVideo:HTMLVideoElement,
    private observer?: RemoteFeedObserver
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
          // TODO: If Janus internals change and webrtcStuff.pc is unavailable, pass the subscriber PC from a Janus plugin callback here.
          const pc = remoteHandle?.webrtcStuff?.pc as RTCPeerConnection | undefined;
          if(pc){
            this.observer?.onSubscriberPcReady?.(feedId, pc);
          }
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
        this.observer?.onRemoteTrackSignal?.(feedId, track, on);
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
      oncleanup:()=>this.removeFeed(feedId, false, true)
    });
  }

  removeFeed(id:number, detach:boolean = true, notify:boolean = true){
    let removed = false;
    const h = this.feeds.get(id);
    if(h){
      if(detach){
        try{h.detach();}catch{}
      }
      this.feeds.delete(id);
      removed = true;
    }

    const tracks = this.feedTracks.get(id);
    if(tracks){
      tracks.forEach(t => this.media.removeRemoteTrack(this.remoteVideo, t));
      this.feedTracks.delete(id);
      removed = true;
    }

    if(removed && notify){
      this.observer?.onRemoteFeedCleanup?.(id);
    }
  }

  cleanupAll(){
    Array.from(this.feeds.keys()).forEach(id => this.removeFeed(id, true, true));
    this.media.clearRemote(this.remoteVideo);
  }
}
