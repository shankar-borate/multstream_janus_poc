class RemoteFeedManager {
  private feeds = new Map<number, any>();
  private feedTracks = new Map<number, Map<string, MediaStreamTrack>>();
  private pendingFeedAttach = new Set<number>();
  private pendingAttachTimers = new Map<number, number>();
  private feedStartTimers = new Map<number, number>();
  private retryTimers = new Map<number, number>();
  private retryAttempts = new Map<number, number>();
  private retryBlockedUntil = new Map<number, number>();

  constructor(
    private janus:any,
    private roomId:number,
    private privateId:number,
    private opaqueId:string,
    private media:MediaManager,
    private remoteVideo:HTMLVideoElement,
    private observer?: RemoteFeedObserver
  ){}

  private clearAttachTimer(feedId: number){
    const t = this.pendingAttachTimers.get(feedId);
    if(t !== undefined){
      window.clearTimeout(t);
      this.pendingAttachTimers.delete(feedId);
    }
  }

  private clearFeedStartTimer(feedId: number){
    const t = this.feedStartTimers.get(feedId);
    if(t !== undefined){
      window.clearTimeout(t);
      this.feedStartTimers.delete(feedId);
    }
  }

  private clearRetryTimer(feedId: number){
    const t = this.retryTimers.get(feedId);
    if(t !== undefined){
      window.clearTimeout(t);
      this.retryTimers.delete(feedId);
    }
  }

  private resetRetryState(feedId: number){
    this.retryAttempts.delete(feedId);
    this.retryBlockedUntil.delete(feedId);
  }

  private scheduleReattach(feedId:number, reason:string){
    if(this.retryTimers.has(feedId)) return;
    const now = Date.now();
    const blockedUntil = this.retryBlockedUntil.get(feedId) ?? 0;
    if(blockedUntil > now){
      Logger.warn(`Remote feed ${feedId} retry blocked until ${new Date(blockedUntil).toISOString()}`);
      return;
    }

    const maxAttempts = APP_CONFIG.call.remoteFeedRetryMaxAttempts;
    const attempt = (this.retryAttempts.get(feedId) ?? 0) + 1;
    this.retryAttempts.set(feedId, attempt);
    if(attempt > maxAttempts){
      const cooldownUntil = now + APP_CONFIG.call.remoteFeedRetryCooldownMs;
      this.retryAttempts.set(feedId, 0);
      this.retryBlockedUntil.set(feedId, cooldownUntil);
      Logger.error(`Remote feed ${feedId} retries exhausted after ${maxAttempts} attempts. Cooldown started. reason=${reason}`);
      this.observer?.onRemoteFeedRetryExhausted?.(feedId, maxAttempts);
      return;
    }

    const baseDelayMs = APP_CONFIG.call.remoteFeedRetryDelayMs;
    const maxDelayMs = APP_CONFIG.call.remoteFeedRetryMaxDelayMs;
    const jitterMaxMs = APP_CONFIG.call.remoteFeedRetryJitterMs;
    const backoffDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)));
    const jitter = Math.floor(Math.random() * Math.max(1, jitterMaxMs));
    const delayMs = backoffDelay + jitter;
    Logger.warn(`Remote feed ${feedId} retry scheduled (${attempt}/${maxAttempts}, delay=${delayMs}ms): ${reason}`);
    const t = window.setTimeout(()=>{
      this.retryTimers.delete(feedId);
      this.addFeed(feedId);
    }, delayMs);
    this.retryTimers.set(feedId, t);
  }

  addFeed(feedId:number){
    if(this.feeds.has(feedId) || this.pendingFeedAttach.has(feedId)) return;
    const blockedUntil = this.retryBlockedUntil.get(feedId) ?? 0;
    if(blockedUntil > Date.now()){
      Logger.warn(`Remote feed ${feedId} add skipped during cooldown`);
      return;
    }
    if(blockedUntil !== 0){
      this.retryBlockedUntil.delete(feedId);
    }
    if(!this.janus){
      Logger.error(`Remote feed ${feedId} attach skipped: Janus session not ready`);
      return;
    }
    this.clearRetryTimer(feedId);
    this.pendingFeedAttach.add(feedId);
    this.clearAttachTimer(feedId);
    const attachTimer = window.setTimeout(()=>{
      if(!this.pendingFeedAttach.has(feedId)) return;
      this.pendingFeedAttach.delete(feedId);
      this.clearAttachTimer(feedId);
      Logger.error(`Remote feed ${feedId} attach timed out`);
      this.scheduleReattach(feedId, "attach timeout");
    }, APP_CONFIG.call.remoteFeedAttachTimeoutMs);
    this.pendingAttachTimers.set(feedId, attachTimer);

    let remoteHandle:any = null;

    this.janus.attach({
      plugin:"janus.plugin.videoroom",
      opaqueId:this.opaqueId,
      success:(h:any)=>{
        remoteHandle=h;
        this.pendingFeedAttach.delete(feedId);
        this.clearAttachTimer(feedId);
        this.feeds.set(feedId,h);
        this.resetRetryState(feedId);
        this.clearFeedStartTimer(feedId);
        const startTimer = window.setTimeout(()=>{
          if(!this.feeds.has(feedId)) return;
          Logger.error(`Remote feed ${feedId} did not start media in time`);
          this.removeFeed(feedId, true, true);
        }, APP_CONFIG.call.remoteFeedStartTimeoutMs);
        this.feedStartTimers.set(feedId, startTimer);
        h.send({ message:{ request:"join", room:this.roomId, ptype:"subscriber", feed:feedId, private_id:this.privateId }});
      },
      error:(e:any)=>{
        this.pendingFeedAttach.delete(feedId);
        this.clearAttachTimer(feedId);
        Logger.error("Remote attach error: "+JSON.stringify(e));
        this.scheduleReattach(feedId, `attach error: ${JSON.stringify(e)}`);
      },
      onmessage:(msg:any,jsep:any)=>{
        const data = msg?.plugindata?.data;
        if(data?.error || data?.error_code){
          Logger.error(`Remote feed ${feedId} plugin error: ${JSON.stringify(data)}`);
        }
        if(msg?.janus === "hangup"){
          Logger.error(`Remote feed ${feedId} hangup: ${msg?.reason || "unknown"}`);
          this.removeFeed(feedId, true, true);
          return;
        }
        if(jsep){
          this.clearFeedStartTimer(feedId);
          // TODO: If Janus internals change and webrtcStuff.pc is unavailable, pass the subscriber PC from a Janus plugin callback here.
          const pc = remoteHandle?.webrtcStuff?.pc as RTCPeerConnection | undefined;
          if(pc){
            this.observer?.onSubscriberPcReady?.(feedId, pc);
          }
          const answerTracks = [
            {type:"audio",capture:false,recv:true},
            {type:"video",capture:false,recv:true}
          ];
          if (APP_CONFIG.mediaTelemetry.enablePeerTelemetry) {
            answerTracks.push({type:"data"} as any);
          }
          remoteHandle.createAnswer({
            jsep,
            tracks: answerTracks,
            success:(ans:any)=>remoteHandle.send({ message:{ request:"start", room:this.roomId }, jsep:ans }),
            error:(e:any)=>{
              Logger.error("Remote answer error: "+JSON.stringify(e));
              this.removeFeed(feedId, true, true);
            }
          });
        }
      },
      ondata: (payload: any) => {
        if (!payload || typeof payload !== "string") return;
        try {
          const parsed = JSON.parse(payload);
          if (parsed?.type !== "vcx-peer-telemetry") return;
          this.observer?.onRemoteTelemetry?.(feedId, parsed as PeerPlaybackTelemetry);
        } catch (e: any) {
          Logger.error(`Remote feed ${feedId} telemetry parse failed`, e);
        }
      },
      onlocaltrack:()=>{},
      onremotetrack:(track:MediaStreamTrack,_mid:string,on:boolean)=>{
        this.observer?.onRemoteTrackSignal?.(feedId, track, on);
        if(on){
          this.resetRetryState(feedId);
          this.clearFeedStartTimer(feedId);
        }
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
      oncleanup:()=>{
        this.clearFeedStartTimer(feedId);
        this.removeFeed(feedId, false, true);
      }
    });
  }

  removeFeed(id:number, detach:boolean = true, notify:boolean = true){
    this.pendingFeedAttach.delete(id);
    this.clearAttachTimer(id);
    this.clearFeedStartTimer(id);
    this.clearRetryTimer(id);
    let removed = false;
    const h = this.feeds.get(id);
    if(h){
      if(detach){
        try{h.detach();}catch(e:any){
          Logger.error(`Remote feed ${id} detach failed`, e);
        }
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
    this.pendingAttachTimers.forEach(t => window.clearTimeout(t));
    this.pendingAttachTimers.clear();
    this.feedStartTimers.forEach(t => window.clearTimeout(t));
    this.feedStartTimers.clear();
    this.retryTimers.forEach(t => window.clearTimeout(t));
    this.retryTimers.clear();
    this.retryAttempts.clear();
    this.retryBlockedUntil.clear();
    this.pendingFeedAttach.clear();
    Array.from(this.feeds.keys()).forEach(id => this.removeFeed(id, true, false));
    this.media.clearRemote(this.remoteVideo);
  }
}
