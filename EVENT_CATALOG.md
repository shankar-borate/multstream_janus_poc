# VCX Event Catalog

Legend:
- `[S]` Send to server (RMS/reporting)
- `[A]` Relay to agent UI (customer-side diagnostic visibility)
- `[S,A]` Send to both

## Call / Meeting Lifecycle
- `VCX_MEETING_JOIN_REQUESTED` `[S]` Meeting join requested.
- `VCX_MEETING_JOIN_STARTED` `[S]` Joining meeting started.
- `VCX_MEETING_JOIN_SUCCESS` `[S]` Meeting connected successfully.
- `VCX_MEETING_JOIN_FAILED` `[S,A]` Meeting join failed.
- `VCX_MEETING_RETRY_SCHEDULED` `[S]` Retry scheduled for meeting connection.
- `VCX_MEETING_RETRY_STARTED` `[S]` Meeting retry started.
- `VCX_MEETING_RETRY_EXHAUSTED` `[S,A]` Retry limit reached for meeting connection.
- `VCX_MEETING_RECONNECT_REQUESTED` `[S]` Reconnect requested.
- `VCX_MEETING_LEFT_BY_LOCAL` `[S]` Meeting ended by local user.
- `VCX_MEETING_LEFT_BY_REMOTE` `[S,A]` Remote user left the meeting.
- `VCX_MEETING_ENDED` `[S]` Meeting ended.
- `VCX_MEETING_FATAL_ERROR` `[S,A]` Fatal call error. Reconnect required.

## Participant / Roster
- `VCX_PARTICIPANT_SELF_JOINED` `[S]` Local participant joined room.
- `VCX_PARTICIPANT_REMOTE_JOINED` `[S,A]` Remote participant joined.
- `VCX_PARTICIPANT_REMOTE_LEFT` `[S,A]` Remote participant left.
- `VCX_PARTICIPANT_UNPUBLISHED` `[S]` Participant unpublished media.
- `VCX_PARTICIPANT_ROSTER_SYNC_STARTED` `[S]` Participant sync started.
- `VCX_PARTICIPANT_ROSTER_SYNC_SUCCESS` `[S]` Participant sync completed.
- `VCX_PARTICIPANT_ROSTER_SYNC_TIMEOUT` `[S]` Participant sync timed out.
- `VCX_PARTICIPANT_ROSTER_SYNC_FAILED` `[S]` Participant sync failed.

## Camera / Mic / Local Media
- `VCX_MEDIA_DEVICE_REQUESTED` `[S]` Requesting camera and microphone.
- `VCX_CAMERA_ACCESS_GRANTED` `[S]` Camera access granted.
- `VCX_CAMERA_ACCESS_FAILED` `[S,A]` Camera access failed.
- `VCX_MIC_ACCESS_FAILED` `[S,A]` Microphone access failed.
- `VCX_MEDIA_PERMISSION_BLOCKED` `[S,A]` Camera/Mic permission blocked.
- `VCX_MEDIA_DEVICE_NOT_FOUND` `[S,A]` Camera or microphone not found.
- `VCX_MEDIA_DEVICE_BUSY` `[S,A]` Camera or microphone is busy.
- `VCX_MEDIA_CONSTRAINT_UNSUPPORTED` `[S,A]` Media constraints not supported.
- `VCX_LOCAL_AUDIO_MUTED` `[S]` Local audio muted.
- `VCX_LOCAL_AUDIO_UNMUTED` `[S]` Local audio unmuted.
- `VCX_LOCAL_VIDEO_MUTED` `[S]` Local video muted.
- `VCX_LOCAL_VIDEO_UNMUTED` `[S]` Local video unmuted.
- `VCX_LOCAL_VIDEO_TOGGLE_FAILED` `[S]` Video toggle failed.
- `VCX_MEDIA_TRACK_REPLACE_FAILED` `[S]` Media track replacement failed.

## Screen Share / Virtual Background
- `VCX_SCREEN_SHARE_STARTED` `[S]` Screen share started.
- `VCX_SCREEN_SHARE_STOPPED` `[S]` Screen share stopped.
- `VCX_SCREEN_SHARE_FAILED` `[S,A]` Screen share failed.
- `VCX_SCREEN_SHARE_PERMISSION_BLOCKED` `[S,A]` Screen share blocked or canceled.
- `VCX_VB_ENABLED` `[S]` Virtual background enabled.
- `VCX_VB_DISABLED` `[S]` Virtual background disabled.
- `VCX_VB_ENABLE_FAILED` `[S,A]` Virtual background enable failed.
- `VCX_VB_PROCESSING_FAILED` `[S]` Virtual background processing failed.
- `VCX_VB_SOURCE_RECOVERY_FAILED` `[S]` Virtual background source recovery failed.

## Recording
- `VCX_RECORDING_START_REQUESTED` `[S]` Recording start requested.
- `VCX_RECORDING_STARTED` `[S]` Recording started.
- `VCX_RECORDING_START_FAILED` `[S,A]` Recording start failed.
- `VCX_RECORDING_START_RETRYING` `[S]` Recording start retrying.
- `VCX_RECORDING_STOP_REQUESTED` `[S]` Recording stop requested.
- `VCX_RECORDING_STOPPED` `[S]` Recording stopped.
- `VCX_RECORDING_STOP_FAILED` `[S,A]` Recording stop failed.
- `VCX_RECORDING_STOP_RETRYING` `[S]` Recording stop retrying.
- `VCX_RECORDING_FAILED_ENDING_CALL` `[S,A]` Recording failed repeatedly, ending call.

## Janus Signaling / VideoRoom
- `VCX_JANUS_INIT_STARTED` `[S]` Janus initialization started.
- `VCX_JANUS_INIT_SUCCESS` `[S]` Janus initialized.
- `VCX_JANUS_INIT_FAILED` `[S,A]` Janus initialization failed.
- `VCX_JANUS_SESSION_CREATE_STARTED` `[S]` Janus session creation started.
- `VCX_JANUS_SESSION_CREATED` `[S]` Janus session created.
- `VCX_JANUS_SESSION_CREATE_FAILED` `[S,A]` Janus session creation failed.
- `VCX_JANUS_SESSION_DESTROYED` `[S,A]` Janus session destroyed.
- `VCX_JANUS_PUBLISHER_ATTACH_STARTED` `[S]` Attaching publisher plugin.
- `VCX_JANUS_PUBLISHER_ATTACHED` `[S]` Publisher plugin attached.
- `VCX_JANUS_PUBLISHER_ATTACH_FAILED` `[S,A]` Publisher attach failed.
- `VCX_JANUS_VIDEOROOM_EXISTS_CHECK_STARTED` `[S]` VideoRoom exists check started.
- `VCX_JANUS_VIDEOROOM_EXISTS_CHECK_FAILED` `[S]` VideoRoom exists check failed.
- `VCX_JANUS_VIDEOROOM_CREATE_STARTED` `[S]` VideoRoom create started.
- `VCX_JANUS_VIDEOROOM_CREATED` `[S]` VideoRoom created.
- `VCX_JANUS_VIDEOROOM_CREATE_FAILED` `[S,A]` VideoRoom create failed.
- `VCX_JANUS_VIDEOROOM_JOIN_STARTED` `[S]` VideoRoom join started.
- `VCX_JANUS_VIDEOROOM_JOINED` `[S]` VideoRoom joined.
- `VCX_JANUS_VIDEOROOM_JOIN_FAILED` `[S,A]` VideoRoom join failed.
- `VCX_JANUS_PUBLISHER_PLUGIN_ERROR` `[S,A]` Janus publisher plugin error.
- `VCX_JANUS_PUBLISHER_HANGUP` `[S,A]` Janus publisher hangup received.
- `VCX_JANUS_ROOM_DESTROYED_EVENT` `[S,A]` Janus room destroyed event received.
- `VCX_JANUS_DESTROY_FAILED` `[S]` Janus destroy failed.

## WebRTC / ICE / TURN
- `VCX_WEBRTC_OFFER_CREATE_STARTED` `[S]` WebRTC offer creation started.
- `VCX_WEBRTC_OFFER_CREATE_FAILED` `[S,A]` WebRTC offer creation failed.
- `VCX_WEBRTC_PC_STATE_CHANGED` `[S]` Peer connection state changed.
- `VCX_PEER_CONNECTION_FAILED` `[S,A]` Peer connection failed.
- `VCX_ICE_GATHERING_STATE_CHANGED` `[S]` ICE gathering state changed.
- `VCX_ICE_CONNECTION_STATE_CHANGED` `[S]` ICE connection state changed.
- `VCX_ICE_CONNECTION_FAILED` `[S,A]` ICE connection failed.
- `VCX_ICE_CONNECTION_DISCONNECTED` `[S,A]` ICE connection disconnected.
- `VCX_ICE_RECONNECTED` `[S]` ICE reconnected.
- `VCX_TURN_RELAY_SELECTED` `[S]` TURN relay candidate selected.
- `VCX_TURN_ALLOCATION_FAILED` `[S,A]` TURN allocation failed.
- `VCX_TURN_AUTH_FAILED` `[S,A]` TURN authentication failed.
- `VCX_TURN_UNREACHABLE` `[S,A]` TURN server unreachable.
- `VCX_STUN_OR_ICE_SERVER_UNREACHABLE` `[S,A]` STUN/ICE server unreachable.

## Remote Feed (Subscriber Side)
- `VCX_REMOTE_FEED_ATTACH_STARTED` `[S]` Remote feed attach started.
- `VCX_REMOTE_FEED_ATTACHED` `[S]` Remote feed attached.
- `VCX_REMOTE_FEED_ATTACH_TIMEOUT` `[S,A]` Remote feed attach timed out.
- `VCX_REMOTE_FEED_ATTACH_FAILED` `[S,A]` Remote feed attach failed.
- `VCX_REMOTE_FEED_START_TIMEOUT` `[S,A]` Remote feed did not start in time.
- `VCX_REMOTE_FEED_ANSWER_FAILED` `[S,A]` Remote feed answer failed.
- `VCX_REMOTE_FEED_PLUGIN_ERROR` `[S,A]` Remote feed plugin error.
- `VCX_REMOTE_FEED_HANGUP` `[S,A]` Remote feed hangup.
- `VCX_REMOTE_FEED_CLEANUP` `[S]` Remote feed cleanup.
- `VCX_REMOTE_FEED_RETRY_SCHEDULED` `[S]` Remote feed retry scheduled.
- `VCX_REMOTE_FEED_RETRY_EXHAUSTED` `[S,A]` Remote feed retry exhausted.
- `VCX_REMOTE_FEED_DETACH_FAILED` `[S]` Remote feed detach failed.

## Customer Browser Diagnostics (Relay to Agent)
- `VCX_CUSTOMER_DIAG_BROWSER_INFO` `[S,A]` Customer browser details captured.
- `VCX_CUSTOMER_DIAG_OS_INFO` `[S,A]` Customer OS/device details captured.
- `VCX_CUSTOMER_DIAG_NETWORK_OFFLINE` `[S,A]` Customer browser is offline.
- `VCX_CUSTOMER_DIAG_CAMERA_PERMISSION_BLOCKED` `[S,A]` Customer camera permission blocked.
- `VCX_CUSTOMER_DIAG_MIC_PERMISSION_BLOCKED` `[S,A]` Customer microphone permission blocked.
- `VCX_CUSTOMER_DIAG_CAMERA_NOT_FOUND` `[S,A]` Customer camera not found.
- `VCX_CUSTOMER_DIAG_MIC_NOT_FOUND` `[S,A]` Customer microphone not found.
- `VCX_CUSTOMER_DIAG_CAMERA_BUSY` `[S,A]` Customer camera busy in another app.
- `VCX_CUSTOMER_DIAG_MIC_BUSY` `[S,A]` Customer microphone busy in another app.
- `VCX_CUSTOMER_DIAG_SCREEN_SHARE_BLOCKED` `[S,A]` Customer screen-share blocked/canceled.
- `VCX_CUSTOMER_DIAG_ICE_FAILED` `[S,A]` Customer ICE failed.
- `VCX_CUSTOMER_DIAG_TURN_FAILED` `[S,A]` Customer TURN failed.
- `VCX_CUSTOMER_DIAG_HIGH_RTT` `[S,A]` Customer network RTT is high.
- `VCX_CUSTOMER_DIAG_HIGH_JITTER` `[S,A]` Customer network jitter is high.
- `VCX_CUSTOMER_DIAG_HIGH_PACKET_LOSS` `[S,A]` Customer packet loss is high.
- `VCX_CUSTOMER_DIAG_REMOTE_AUDIO_NOT_HEARD` `[S,A]` Customer cannot hear remote audio.
- `VCX_CUSTOMER_DIAG_REMOTE_VIDEO_NOT_SEEN` `[S,A]` Customer cannot see remote video.
- `VCX_CUSTOMER_DIAG_RECOVERY_ACTION_REQUIRED` `[S,A]` Customer action required (permissions/device/network).
- `VCX_CUSTOMER_DIAG_RESOLVED` `[S,A]` Customer issue resolved.
