type JoinConfig = { server:string; roomId:number; display:string; };
type ParticipantSnapshot = { roomId:number; participantIds:number[]; selfId?:number; };
type VcxServer = {server:string, client_id:string};
type VcxVideoConfig = { bitrate_bps:number; bitrate_cap:boolean; max_framerate:number; };
type ConnectionOwner = "LOCAL" | "REMOTE" | "SYSTEM" | "NEUTRAL";
type ConnectionSeverity = "info" | "warn" | "error";
type ConnectionProductState =
  | "INIT"
  | "MEDIA_PREP"
  | "NEGOTIATING"
  | "WAITING_REMOTE"
  | "NETWORK_CHECK"
  | "LOCAL_SLOW"
  | "REMOTE_SLOW"
  | "OPTIMIZING"
  | "CONNECTED"
  | "DEGRADED"
  | "RETRYING"
  | "FAILED";
type ConnectionStatusView = {
  owner: ConnectionOwner;
  primaryText: string;
  secondaryText: string;
  severity: ConnectionSeverity;
  state: ConnectionProductState;
};
type RemoteFeedObserver = {
  onSubscriberPcReady?: (feedId: number, pc: RTCPeerConnection) => void;
  onRemoteTrackSignal?: (feedId: number, track: MediaStreamTrack, on: boolean) => void;
  onRemoteFeedCleanup?: (feedId: number) => void;
};
