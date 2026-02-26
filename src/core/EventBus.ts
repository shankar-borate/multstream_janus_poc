type EventHandler<T=any> = (payload:T)=>void;
class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  on<T=any>(event:string, h:EventHandler<T>){
    if(!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(h as EventHandler);
  }
  emit<T=any>(event:string, payload:T){
    const hs = this.handlers.get(event);
    if(!hs) return;
    hs.forEach(h=>{ try{ (h as EventHandler<T>)(payload);} catch(e){ Logger.error(`EventBus handler failed for event=${event}`, e);} });
  }
}
