type JoinConfig = { server:string; roomId:number; display:string; participantId?:number; };
type ParticipantSnapshot = { roomId:number; participantIds:number[]; selfId?:number; };
type VcxServer = {server:string, client_id:string};
type VcxVideoConfig = { bitrate_bps:number; bitrate_cap:boolean; max_framerate:number; };
type YesNoUnknown = "Yes" | "No" | "Unknown";
type PlaybackState = "Active" | "Stalled" | "Unknown";
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
  | "SERVER_RETRYING"
  | "PEER_RETRYING"
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
  onRemoteFeedRetryExhausted?: (feedId: number, attempts: number) => void;
  onRemoteTelemetry?: (feedId: number, payload: PeerPlaybackTelemetry) => void;
};
type PeerPlaybackTelemetry = {
  type: "vcx-peer-telemetry";
  ts: number;
  audioPlaybackStatus: PlaybackState;
  videoPlaybackStatus: PlaybackState;
};
type MediaStatusMatrix = {
  remoteReceivingYourVideo: YesNoUnknown;
  remoteReceivingYourAudio: YesNoUnknown;
  remoteAudioPlaybackStatus: PlaybackState;
  remoteVideoPlaybackStatus: PlaybackState;
  localReceivingYourVideo: YesNoUnknown;
  localReceivingYourAudio: YesNoUnknown;
  localAudioPlaybackStatus: PlaybackState;
  localVideoPlaybackStatus: PlaybackState;
};
type MediaIoSnapshot = {
  bytes: {
    audioSent: number;
    audioReceived: number;
    videoSent: number;
    videoReceived: number;
  };
  quality: {
    localJitterMs: number | null;
    localLossPct: number | null;
    remoteJitterMs: number | null;
    remoteLossPct: number | null;
  };
  issues: string[];
  matrix: MediaStatusMatrix;
  ts: number;
};
