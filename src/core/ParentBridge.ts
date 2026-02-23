class ParentBridge {
  emit(evt:any){
    try{
      if(window.parent && window.parent !== window){
        window.parent.postMessage(evt, "*");
      }
    }catch{}
  }

  onCommand(cb:(cmd:any)=>void){
    window.addEventListener("message", (ev)=>{
      const d:any = ev.data;
      if(d && d.type) cb(d);
    });
  }
}
