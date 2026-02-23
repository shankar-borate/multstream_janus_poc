class JanusGateway {
  private janus: any = null;
  private publisher: any = null;
  private opaqueId = "videocx-ui-" + Janus.randomString(12);

  constructor() {}

  init() {
    Janus.init({
      debug: "all",
      callback: () => {
        Logger.setStatus("Janus initialized");
        Logger.user("Janus.init done");
      }
    });
  }

  /**
   * Creates Janus session.
   * IMPORTANT: pass iceServers from IMS payload.PC_CONFIG.iceServers
   */
  createSession(
    server: string,
    iceServers: RTCIceServer[] | undefined,
    ok: () => void,
    destroyed: () => void
  ) {
    Logger.setStatus("Creating Janus session...");
    Logger.user(`Creating Janus session: ${server}`);

    this.janus = new Janus({
      server,

      // ✅ TURN/STUN config (from IMS)
      // Janus will use these ICE servers for the underlying RTCPeerConnection(s)
      iceServers: iceServers ?? [],

      success: ok,
      error: (e: any) => {
        Logger.setStatus("Janus error: " + JSON.stringify(e));
        Logger.user("Janus session create error: " + JSON.stringify(e));
      },
      destroyed: () => {
        Logger.user("Janus session destroyed");
        destroyed();
      }
    });
  }

  attachPublisher(
    onAttached: (h: any) => void,
    onMessage: (msg: any, jsep: any) => void,
    onLocalTrack: (track: MediaStreamTrack, on: boolean) => void,
    onCleanup: () => void
  ) {
    if (!this.janus) {
      Logger.setStatus("Janus not ready");
      Logger.user("attachPublisher called but Janus session is null");
      return;
    }

    Logger.user("Attaching videoroom publisher plugin...");

    this.janus.attach({
      plugin: "janus.plugin.videoroom",
      opaqueId: this.opaqueId,
      success: (h: any) => {
        this.publisher = h;
        Logger.user(`Publisher plugin attached. handleId=${h.getId?.() ?? "?"}`);
        onAttached(h);
      },
      error: (e: any) => {
        Logger.setStatus("Attach error: " + JSON.stringify(e));
        Logger.user("Attach error: " + JSON.stringify(e));
      },
      onmessage: (msg: any, jsep: any) => {
        onMessage(msg, jsep);
      },
      onlocaltrack: (track: MediaStreamTrack, on: boolean) => {
        onLocalTrack(track, on);
      },
      oncleanup: () => {
        Logger.user("Publisher plugin cleanup");
        onCleanup();
      }
    });
  }

  getJanus() {
    return this.janus;
  }

  getOpaqueId() {
    return this.opaqueId;
  }

  destroy() {
    Logger.user("Destroying Janus session + publisher...");

    try {
      this.publisher?.detach?.();
    } catch {}

    this.publisher = null;

    try {
      this.janus?.destroy?.();
    } catch {}

    this.janus = null;
  }
}
/*class JanusGateway {
  private janus:any = null;
  private publisher:any = null;
  private opaqueId = "videocx-ui-" + Janus.randomString(12);

  constructor(){}

  init(){
    Janus.init({ debug:"all", callback: ()=>Logger.setStatus("Janus initialized") });
  }

  createSession(server:string, ok:()=>void, destroyed:()=>void){
    Logger.setStatus("Creating Janus session...");
    Logger.user(`Creating Janus session: ${server}`);
      this.janus = new Janus({
      server,
      success: ok,
      error: (e:any)=>Logger.setStatus("Janus error: "+JSON.stringify(e)),
      destroyed
    });
  }

  attachPublisher(
    onAttached:(h:any)=>void,
    onMessage:(msg:any,jsep:any)=>void,
    onLocalTrack:(track:MediaStreamTrack,on:boolean)=>void,
    onCleanup:()=>void
  ){
    this.janus.attach({
      plugin:"janus.plugin.videoroom",
      opaqueId:this.opaqueId,
      success:(h:any)=>{ this.publisher=h; onAttached(h); },
      error:(e:any)=>Logger.setStatus("Attach error: "+JSON.stringify(e)),
      onmessage:onMessage,
      onlocaltrack:onLocalTrack,
      oncleanup:onCleanup
    });
  }

  getJanus(){ return this.janus; }
  getOpaqueId(){ return this.opaqueId; }

  destroy(){
    try{ this.publisher?.detach(); }catch{}
    this.publisher = null;
    try{ this.janus?.destroy(); }catch{}
    this.janus = null;
  }
}*/
