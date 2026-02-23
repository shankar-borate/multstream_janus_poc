class RemoteFeedManager {
  private feeds = new Map<number, any>();

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
        if(!on) return;
        this.media.setRemoteTrack(this.remoteVideo, track);
      },
      oncleanup:()=>this.removeFeed(feedId)
    });
  }

  removeFeed(id:number){
    const h = this.feeds.get(id);
    if(h){ try{h.detach();}catch{} this.feeds.delete(id); }
  }

  cleanupAll(){
    this.feeds.forEach(h=>{ try{h.detach();}catch{} });
    this.feeds.clear();
  }
}
