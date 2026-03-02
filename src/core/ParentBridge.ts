class ParentBridge {
  emit(evt:any){
    try{
      if(window.parent && window.parent !== window){
        window.parent.postMessage(evt, "*");
      }
    }catch(e:any){
      Logger.error(ErrorMessages.PARENT_BRIDGE_POST_MESSAGE_FAILED, e);
    }
  }

  onCommand(cb:(cmd:any)=>void){
    window.addEventListener("message", (ev)=>{
      const d:any = ev.data;
      if(d && d.type) cb(d);
    });
  }
}
