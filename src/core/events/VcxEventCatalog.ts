type VcxEventRouteTarget = "SERVER" | "AGENT";
type VcxEventSeverity = "INFO" | "WARN" | "ERROR";

type VcxEventDefinition = {
  id: string;
  category: string;
  message: string;
  severity: VcxEventSeverity;
  deliverTo: readonly VcxEventRouteTarget[];
};

const VCX_EVENT_ROUTE_SERVER: readonly VcxEventRouteTarget[] = ["SERVER"];
const VCX_EVENT_ROUTE_AGENT: readonly VcxEventRouteTarget[] = ["AGENT"];
const VCX_EVENT_ROUTE_SERVER_AGENT: readonly VcxEventRouteTarget[] = ["SERVER", "AGENT"];

const VCX_EVENT_DEFINITIONS: readonly VcxEventDefinition[] = [
  
  // Call / Meeting Lifecycle
  { id: "VCX_MEETING_JOIN_REQUESTED", category: "Call / Meeting Lifecycle", message: "Meeting join requested.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_JOIN_STARTED", category: "Call / Meeting Lifecycle", message: "Joining meeting started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_JOIN_SUCCESS", category: "Call / Meeting Lifecycle", message: "Meeting connected successfully.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_JOIN_FAILED", category: "Call / Meeting Lifecycle", message: "Meeting join failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEETING_RETRY_SCHEDULED", category: "Call / Meeting Lifecycle", message: "Retry scheduled for meeting connection.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_RETRY_STARTED", category: "Call / Meeting Lifecycle", message: "Meeting retry started.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_RETRY_EXHAUSTED", category: "Call / Meeting Lifecycle", message: "Retry limit reached for meeting connection.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEETING_RECONNECT_REQUESTED", category: "Call / Meeting Lifecycle", message: "Reconnect requested.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_LEFT_BY_LOCAL", category: "Call / Meeting Lifecycle", message: "Meeting ended by local user.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_LEFT_BY_REMOTE", category: "Call / Meeting Lifecycle", message: "Remote user left the meeting.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEETING_ENDED", category: "Call / Meeting Lifecycle", message: "Meeting ended.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEETING_FATAL_ERROR", category: "Call / Meeting Lifecycle", message: "Fatal call error. Reconnect required.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  
  // Participant / Roster
  { id: "VCX_PARTICIPANT_SELF_JOINED", category: "Participant / Roster", message: "Local participant joined room.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_PARTICIPANT_REMOTE_JOINED", category: "Participant / Roster", message: "Remote participant joined.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_PARTICIPANT_REMOTE_LEFT", category: "Participant / Roster", message: "Remote participant left.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_PARTICIPANT_UNPUBLISHED", category: "Participant / Roster", message: "Participant unpublished media.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_PARTICIPANT_ROSTER_SYNC_STARTED", category: "Participant / Roster", message: "Participant sync started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_PARTICIPANT_ROSTER_SYNC_SUCCESS", category: "Participant / Roster", message: "Participant sync completed.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_PARTICIPANT_ROSTER_SYNC_TIMEOUT", category: "Participant / Roster", message: "Participant sync timed out.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_PARTICIPANT_ROSTER_SYNC_FAILED", category: "Participant / Roster", message: "Participant sync failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  
  // Camera / Mic / Local Media
  { id: "VCX_MEDIA_DEVICE_REQUESTED", category: "Camera / Mic / Local Media", message: "Requesting camera and microphone.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_CAMERA_ACCESS_GRANTED", category: "Camera / Mic / Local Media", message: "Camera access granted.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_CAMERA_ACCESS_FAILED", category: "Camera / Mic / Local Media", message: "Camera access failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MIC_ACCESS_FAILED", category: "Camera / Mic / Local Media", message: "Microphone access failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEDIA_PERMISSION_BLOCKED", category: "Camera / Mic / Local Media", message: "Camera/Mic permission blocked.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEDIA_DEVICE_NOT_FOUND", category: "Camera / Mic / Local Media", message: "Camera or microphone not found.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEDIA_DEVICE_BUSY", category: "Camera / Mic / Local Media", message: "Camera or microphone is busy.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_MEDIA_CONSTRAINT_UNSUPPORTED", category: "Camera / Mic / Local Media", message: "Media constraints not supported.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_LOCAL_AUDIO_MUTED", category: "Camera / Mic / Local Media", message: "Local audio muted.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_LOCAL_AUDIO_UNMUTED", category: "Camera / Mic / Local Media", message: "Local audio unmuted.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_LOCAL_VIDEO_MUTED", category: "Camera / Mic / Local Media", message: "Local video muted.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_LOCAL_VIDEO_UNMUTED", category: "Camera / Mic / Local Media", message: "Local video unmuted.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_LOCAL_VIDEO_TOGGLE_FAILED", category: "Camera / Mic / Local Media", message: "Video toggle failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_MEDIA_TRACK_REPLACE_FAILED", category: "Camera / Mic / Local Media", message: "Media track replacement failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  
  // Screen Share / Virtual Background
  { id: "VCX_SCREEN_SHARE_STARTED", category: "Screen Share / Virtual Background", message: "Screen share started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_SCREEN_SHARE_STOPPED", category: "Screen Share / Virtual Background", message: "Screen share stopped.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_SCREEN_SHARE_FAILED", category: "Screen Share / Virtual Background", message: "Screen share failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_SCREEN_SHARE_PERMISSION_BLOCKED", category: "Screen Share / Virtual Background", message: "Screen share blocked or canceled.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_VB_ENABLED", category: "Screen Share / Virtual Background", message: "Virtual background enabled.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_VB_DISABLED", category: "Screen Share / Virtual Background", message: "Virtual background disabled.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_VB_ENABLE_FAILED", category: "Screen Share / Virtual Background", message: "Virtual background enable failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_VB_PROCESSING_FAILED", category: "Screen Share / Virtual Background", message: "Virtual background processing failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_VB_SOURCE_RECOVERY_FAILED", category: "Screen Share / Virtual Background", message: "Virtual background source recovery failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  
  // Recording
  { id: "VCX_RECORDING_START_REQUESTED", category: "Recording", message: "Recording start requested.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_RECORDING_STARTED", category: "Recording", message: "Recording started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_RECORDING_START_FAILED", category: "Recording", message: "Recording start failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_RECORDING_START_RETRYING", category: "Recording", message: "Recording start retrying.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_RECORDING_STOP_REQUESTED", category: "Recording", message: "Recording stop requested.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_RECORDING_STOPPED", category: "Recording", message: "Recording stopped.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_RECORDING_STOP_FAILED", category: "Recording", message: "Recording stop failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_RECORDING_STOP_RETRYING", category: "Recording", message: "Recording stop retrying.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_RECORDING_FAILED_ENDING_CALL", category: "Recording", message: "Recording failed repeatedly, ending call.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  
  // Janus Signaling / VideoRoom
  { id: "VCX_JANUS_INIT_STARTED", category: "Janus Signaling / VideoRoom", message: "Janus initialization started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_INIT_SUCCESS", category: "Janus Signaling / VideoRoom", message: "Janus initialized.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_INIT_FAILED", category: "Janus Signaling / VideoRoom", message: "Janus initialization failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_SESSION_CREATE_STARTED", category: "Janus Signaling / VideoRoom", message: "Janus session creation started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_SESSION_CREATED", category: "Janus Signaling / VideoRoom", message: "Janus session created.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_SESSION_CREATE_FAILED", category: "Janus Signaling / VideoRoom", message: "Janus session creation failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_SESSION_DESTROYED", category: "Janus Signaling / VideoRoom", message: "Janus session destroyed.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_PUBLISHER_ATTACH_STARTED", category: "Janus Signaling / VideoRoom", message: "Attaching publisher plugin.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_PUBLISHER_ATTACHED", category: "Janus Signaling / VideoRoom", message: "Publisher plugin attached.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_PUBLISHER_ATTACH_FAILED", category: "Janus Signaling / VideoRoom", message: "Publisher attach failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_VIDEOROOM_EXISTS_CHECK_STARTED", category: "Janus Signaling / VideoRoom", message: "VideoRoom exists check started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_VIDEOROOM_EXISTS_CHECK_FAILED", category: "Janus Signaling / VideoRoom", message: "VideoRoom exists check failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_VIDEOROOM_CREATE_STARTED", category: "Janus Signaling / VideoRoom", message: "VideoRoom create started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_VIDEOROOM_CREATED", category: "Janus Signaling / VideoRoom", message: "VideoRoom created.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_VIDEOROOM_CREATE_FAILED", category: "Janus Signaling / VideoRoom", message: "VideoRoom create failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_VIDEOROOM_JOIN_STARTED", category: "Janus Signaling / VideoRoom", message: "VideoRoom join started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_VIDEOROOM_JOINED", category: "Janus Signaling / VideoRoom", message: "VideoRoom joined.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_JANUS_VIDEOROOM_JOIN_FAILED", category: "Janus Signaling / VideoRoom", message: "VideoRoom join failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_PUBLISHER_PLUGIN_ERROR", category: "Janus Signaling / VideoRoom", message: "Janus publisher plugin error.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_PUBLISHER_HANGUP", category: "Janus Signaling / VideoRoom", message: "Janus publisher hangup received.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_ROOM_DESTROYED_EVENT", category: "Janus Signaling / VideoRoom", message: "Janus room destroyed event received.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_JANUS_DESTROY_FAILED", category: "Janus Signaling / VideoRoom", message: "Janus destroy failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  
  // WebRTC / ICE / TURN
  { id: "VCX_WEBRTC_OFFER_CREATE_STARTED", category: "WebRTC / ICE / TURN", message: "WebRTC offer creation started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_WEBRTC_OFFER_CREATE_FAILED", category: "WebRTC / ICE / TURN", message: "WebRTC offer creation failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_WEBRTC_PC_STATE_CHANGED", category: "WebRTC / ICE / TURN", message: "Peer connection state changed.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_PEER_CONNECTION_FAILED", category: "WebRTC / ICE / TURN", message: "Peer connection failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_ICE_GATHERING_STATE_CHANGED", category: "WebRTC / ICE / TURN", message: "ICE gathering state changed.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_ICE_CONNECTION_STATE_CHANGED", category: "WebRTC / ICE / TURN", message: "ICE connection state changed.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_ICE_CONNECTION_FAILED", category: "WebRTC / ICE / TURN", message: "ICE connection failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_ICE_CONNECTION_DISCONNECTED", category: "WebRTC / ICE / TURN", message: "ICE connection disconnected.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_ICE_RECONNECTED", category: "WebRTC / ICE / TURN", message: "ICE reconnected.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_TURN_RELAY_SELECTED", category: "WebRTC / ICE / TURN", message: "TURN relay candidate selected.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_TURN_ALLOCATION_FAILED", category: "WebRTC / ICE / TURN", message: "TURN allocation failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_TURN_AUTH_FAILED", category: "WebRTC / ICE / TURN", message: "TURN authentication failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_TURN_UNREACHABLE", category: "WebRTC / ICE / TURN", message: "TURN server unreachable.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_STUN_OR_ICE_SERVER_UNREACHABLE", category: "WebRTC / ICE / TURN", message: "STUN/ICE server unreachable.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  
  // Remote Feed (Subscriber Side)
  { id: "VCX_REMOTE_FEED_ATTACH_STARTED", category: "Remote Feed (Subscriber Side)", message: "Remote feed attach started.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_REMOTE_FEED_ATTACHED", category: "Remote Feed (Subscriber Side)", message: "Remote feed attached.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_REMOTE_FEED_ATTACH_TIMEOUT", category: "Remote Feed (Subscriber Side)", message: "Remote feed attach timed out.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_ATTACH_FAILED", category: "Remote Feed (Subscriber Side)", message: "Remote feed attach failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_START_TIMEOUT", category: "Remote Feed (Subscriber Side)", message: "Remote feed did not start in time.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_ANSWER_FAILED", category: "Remote Feed (Subscriber Side)", message: "Remote feed answer failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_PLUGIN_ERROR", category: "Remote Feed (Subscriber Side)", message: "Remote feed plugin error.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_HANGUP", category: "Remote Feed (Subscriber Side)", message: "Remote feed hangup.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_CLEANUP", category: "Remote Feed (Subscriber Side)", message: "Remote feed cleanup.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_REMOTE_FEED_RETRY_SCHEDULED", category: "Remote Feed (Subscriber Side)", message: "Remote feed retry scheduled.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER },
  { id: "VCX_REMOTE_FEED_RETRY_EXHAUSTED", category: "Remote Feed (Subscriber Side)", message: "Remote feed retry exhausted.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_REMOTE_FEED_DETACH_FAILED", category: "Remote Feed (Subscriber Side)", message: "Remote feed detach failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER },
  
  // Customer Browser Diagnostics (Relay to Agent)
  { id: "VCX_CUSTOMER_DIAG_BROWSER_INFO", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer browser details captured.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_OS_INFO", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer OS/device details captured.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_NETWORK_OFFLINE", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer browser is offline.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_CAMERA_PERMISSION_BLOCKED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer camera permission blocked.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_MIC_PERMISSION_BLOCKED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer microphone permission blocked.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_CAMERA_NOT_FOUND", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer camera not found.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_MIC_NOT_FOUND", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer microphone not found.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_CAMERA_BUSY", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer camera busy in another app.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_MIC_BUSY", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer microphone busy in another app.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_SCREEN_SHARE_BLOCKED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer screen-share blocked/canceled.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_ICE_FAILED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer ICE failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_TURN_FAILED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer TURN failed.", severity: "ERROR", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_HIGH_RTT", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer network RTT is high.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_HIGH_JITTER", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer network jitter is high.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_HIGH_PACKET_LOSS", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer packet loss is high.", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_REMOTE_AUDIO_NOT_HEARD", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer cannot hear remote audio.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_REMOTE_VIDEO_NOT_SEEN", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer cannot see remote video.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_RECOVERY_ACTION_REQUIRED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer action required (permissions/device/network).", severity: "WARN", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
  { id: "VCX_CUSTOMER_DIAG_RESOLVED", category: "Customer Browser Diagnostics (Relay to Agent)", message: "Customer issue resolved.", severity: "INFO", deliverTo: VCX_EVENT_ROUTE_SERVER_AGENT },
];

type VcxEventId = (typeof VCX_EVENT_DEFINITIONS)[number]["id"];

class VcxEventCatalog {
  static readonly EVENTS: readonly VcxEventDefinition[] = VCX_EVENT_DEFINITIONS;

  static get(eventId: string): VcxEventDefinition | null {
    for (const eventDef of VCX_EVENT_DEFINITIONS) {
      if (eventDef.id === eventId) return eventDef;
    }
    return null;
  }

  static has(eventId: string): eventId is VcxEventId {
    return VcxEventCatalog.get(eventId) !== null;
  }

  static listByCategory(category: string): VcxEventDefinition[] {
    return VCX_EVENT_DEFINITIONS.filter((eventDef) => eventDef.category === category);
  }
}
