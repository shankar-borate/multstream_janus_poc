class JanusGateway {
  private janus: any = null;
  private publisher: any = null;
  private opaqueId = "videocx-ui-" + Janus.randomString(12);

  constructor() {}

  init() {
    Janus.init({
      debug: APP_CONFIG.janus.initDebug,
      callback: () => {
        Logger.setStatus(ErrorMessages.JANUS_INITIALIZED);
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
    destroyed: () => void,
    onError?: (e: any) => void
  ) {
    Logger.setStatus(ErrorMessages.JANUS_CREATING_SESSION);
    Logger.user(`Creating Janus session: ${server}`);

    this.janus = new Janus({
      server,

      // ✅ TURN/STUN config (from IMS)
      // Janus will use these ICE servers for the underlying RTCPeerConnection(s)
      iceServers: iceServers ?? [],

      success: ok,
      error: (e: any) => {
        Logger.setStatus(ErrorMessages.janusErrorStatus(e));
        Logger.user(`[janus-info] ${ErrorMessages.janusSessionCreateError(e)}`);
        onError?.(e);
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
    onCleanup: () => void,
    onError?: (e: any) => void,
    onSlowLink?: (payload: JanusSlowLinkEvent) => void
  ) {
    if (!this.janus) {
      Logger.setStatus(ErrorMessages.JANUS_NOT_READY_STATUS);
      Logger.user("attachPublisher called but Janus session is null");
      onError?.(new Error(ErrorMessages.JANUS_NOT_READY_ERROR));
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
        Logger.setStatus(ErrorMessages.janusAttachErrorStatus(e));
        Logger.user(`[janus-info] ${ErrorMessages.janusAttachErrorLog(e)}`);
        onError?.(e);
      },
      onmessage: (msg: any, jsep: any) => {
        onMessage(msg, jsep);
      },
      onlocaltrack: (track: MediaStreamTrack, on: boolean) => {
        onLocalTrack(track, on);
      },
      slowLink: (uplink: boolean, lost: number, mid: string) => {
        onSlowLink?.({
          uplink: !!uplink,
          lost: Number.isFinite(lost) ? Number(lost) : 0,
          mid: typeof mid === "string" ? mid : null
        });
      },
      onslowlink: (uplink: boolean, lost: number, mid: string) => {
        onSlowLink?.({
          uplink: !!uplink,
          lost: Number.isFinite(lost) ? Number(lost) : 0,
          mid: typeof mid === "string" ? mid : null
        });
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
    } catch (e: any) {
      Logger.error(ErrorMessages.JANUS_PUBLISHER_DETACH_FAILED, e);
    }

    this.publisher = null;

    try {
      this.janus?.destroy?.();
    } catch (e: any) {
      Logger.error(ErrorMessages.JANUS_DESTROY_FAILED, e);
    }

    this.janus = null;
  }
}
