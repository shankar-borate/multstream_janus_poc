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
      server: APP_CONFIG.vcx.imsBaseUrl,
      client_id: APP_CONFIG.vcx.clientId
    };
  }

  static getVcxVideoConfig():VcxVideoConfig {
    return {
      bitrate_bps: APP_CONFIG.media.bitrateBps,
      bitrate_cap: APP_CONFIG.media.bitrateCap,
      max_framerate: APP_CONFIG.media.maxFramerate
    };
  }

  static buildJoinConfig():JoinConfig{
    const roomIdRaw = this.getString("roomId", "");
    if(!roomIdRaw){
      alert("This call link is missing a room ID, so we can't join yet. Please open the full link again or add ?roomId=1234 to the URL.");
      throw new Error("Missing required query param: roomId");
    }

    const roomId = parseInt(roomIdRaw, 10);
    if(!Number.isFinite(roomId)){
      alert("This call link is missing a room ID, so we can't join yet. Please open the full link again or add ?roomId=1234 to the URL.");
      throw new Error("Invalid query param: roomId must be a number");
    }

    const participantIdRaw = this.getString("participantId", "");
    let participantId: number | undefined = undefined;
    if (participantIdRaw) {
      const parsedParticipantId = parseInt(participantIdRaw, 10);
      if (!Number.isFinite(parsedParticipantId) || parsedParticipantId <= 0) {
        throw new Error("Invalid query param: participantId must be a positive number");
      }
      participantId = parsedParticipantId;
    }

    return {
      server: this.getString("server", APP_CONFIG.vcx.defaultJanusServer),
      roomId,
      display: this.getString("name", APP_CONFIG.vcx.defaultDisplayName),
      participantId
    };
  }
}
