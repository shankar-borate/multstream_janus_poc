type JoinConfig = { server:string; roomId:number; display:string; participantId?:number; };
type JoinBootstrapConfig = { server:string; groupId:number; display:string; participantId?:number; };
type ParticipantSnapshot = { roomId:number; participantIds:number[]; selfId?:number; };
type VcxServer = {server:string, client_id:string};
type VcxVideoConfig = { bitrate_bps:number; bitrate_cap:boolean; max_framerate:number; };
type YesNoUnknown = "Yes" | "No" | "Pending" | "Not possible";
type PlaybackState = "Active" | "Stalled" | "Pending" | "Not possible";
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
  onRemoteNetworkTelemetry?: (feedId: number, payload: PeerNetworkTelemetry) => void;
  onRemoteHoldState?: (feedId: number, payload: PeerHoldState) => void;
  onSlowLink?: (feedId: number, payload: JanusSlowLinkEvent) => void;
};
type PeerPlaybackTelemetry = {
  type: "vcx-peer-telemetry";
  ts: number;
  audioPlaybackStatus: PlaybackState;
  videoPlaybackStatus: PlaybackState;
};
type PeerNetworkTelemetry = {
  type: "vcx-peer-network";
  ts: number;
  uploadKbps: number | null;
  downloadKbps: number | null;
  lossPct: number | null;
  jitterMs: number | null;
};
type PeerHoldState = {
  type: "vcx-peer-hold";
  ts: number;
  onHold: boolean;
  fromParticipantId?: number | null;
};
type JanusSlowLinkEvent = {
  uplink: boolean;
  lost: number;
  mid: string | null;
};
type JanusSlowLinkSignal = {
  participantId: number | null;
  feedId: number | null;
  source: "publisher" | "subscriber";
  direction: "uplink" | "downlink";
  lost: number;
  mid: string | null;
  at: number;
};
type ParticipantNetworkPeers = {
  selfId: number | null;
  publisher: RTCPeerConnection | null;
  subscribers: Array<{ feedId: number; pc: RTCPeerConnection }>;
};
type ParticipantNetworkTier = "Good" | "Medium" | "Low" | "Pending";
type ParticipantNetworkDirectionSnapshot = {
  kbps: number | null;
  tier: ParticipantNetworkTier;
  slowLink: boolean;
};
type ParticipantNetworkQualitySnapshot = {
  localRttMs: number | null;
  localJitterMs: number | null;
  localLossPct: number | null;
  remoteRttMs: number | null;
  remoteJitterMs: number | null;
  remoteLossPct: number | null;
};
type ParticipantNetworkRow = {
  participantId: number | null;
  label: string;
  upload: ParticipantNetworkDirectionSnapshot;
  download: ParticipantNetworkDirectionSnapshot;
  remoteUpload: ParticipantNetworkDirectionSnapshot;
  remoteDownload: ParticipantNetworkDirectionSnapshot;
  quality: ParticipantNetworkQualitySnapshot;
  likelyBottleneck: "You" | "Remote" | "Both" | "Unknown";
};
type ParticipantNetworkSnapshot = {
  rows: ParticipantNetworkRow[];
  updatedAt: number;
};
type NetworkRiskSignal = {
  mode: "normal" | "low";
  uploadKbps: number | null;
  likelyDisconnect: boolean;
  message: string;
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
