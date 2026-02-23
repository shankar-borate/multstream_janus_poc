class UrlConfig {
  static getString(k:string, fb:string=""):string{
    const v = new URLSearchParams(window.location.search).get(k);
    return v && v.trim() ? v.trim() : fb;
  }
  static getNumber(k:string, fb:number):number{
    const s = this.getString(k,"");
    const n = parseInt(s,10);
    return Number.isFinite(n) ? n : fb;
  }
  static getVcxServer():VcxServer {
    return {
      server:"https://localhost.beta.videocx.io",
      client_id:"101"
    }
  }
  static buildJoinConfig():JoinConfig{
    const roomIdRaw = this.getString("roomId", "");
    if(!roomIdRaw){
      alert ("This call link is missing a room ID, so we can’t join yet.Please open the full link again or add ?roomId=1234 to the URL.")
      throw new Error("Missing required query param: roomId");
    }
    const roomId = parseInt(roomIdRaw, 10);
    if(!Number.isFinite(roomId)){
          alert ("This call link is missing a room ID, so we can’t join yet.Please open the full link again or add ?roomId=1234 to the URL.")
      throw new Error("Invalid query param: roomId must be a number");
    }
    return {
      server: this.getString("server","wss://localhost.beta.videocx.io/mstream_janus"),
      roomId,
      display: this.getString("name","Guest")
    };
  }
}
