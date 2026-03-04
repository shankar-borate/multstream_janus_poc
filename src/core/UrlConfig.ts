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

  static buildJoinConfig():JoinBootstrapConfig{
    const groupIdRaw = this.getString("groupId", "");
    if(!groupIdRaw){
      alert(ErrorMessages.URL_GROUP_ID_ALERT);
      throw new Error(ErrorMessages.URL_GROUP_ID_MISSING);
    }

    const groupId = parseInt(groupIdRaw, 10);
    if(!Number.isFinite(groupId)){
      alert(ErrorMessages.URL_GROUP_ID_ALERT);
      throw new Error(ErrorMessages.URL_GROUP_ID_INVALID);
    }

    const participantIdRaw = this.getString("participantId", "");
    let participantId: number | undefined = undefined;
    if (participantIdRaw) {
      const parsedParticipantId = parseInt(participantIdRaw, 10);
      if (!Number.isFinite(parsedParticipantId) || parsedParticipantId <= 0) {
        throw new Error(ErrorMessages.URL_PARTICIPANT_ID_INVALID);
      }
      participantId = parsedParticipantId;
    }

    const userTypeRaw =
      this.getString("user_type", "") ||
      this.getString("usertpye", "") ||
      this.getString("usertype", "");
    const isCustomer = userTypeRaw.trim().toLowerCase() === "customer";
    if (isCustomer) {
      const ruId =
        this.getString("ruId", "") ||
        this.getString("ruid", "");
      if (!ruId) {
        alert(ErrorMessages.URL_RUID_ALERT);
        throw new Error(ErrorMessages.URL_RUID_MISSING);
      }
    }

    return {
      server: this.getString("server", APP_CONFIG.vcx.defaultJanusServer),
      groupId,
      display: this.getString("name", APP_CONFIG.vcx.defaultDisplayName),
      participantId
    };
  }
}
