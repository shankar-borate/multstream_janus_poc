class ErrorMessages {
  static readonly URL_ROOM_ID_ALERT =
    "This call link is missing a room ID, so we can't join yet. Please open the full link again or add ?roomId=1234 to the URL.";
  static readonly URL_ROOM_ID_MISSING = "Missing required query param: roomId";
  static readonly URL_ROOM_ID_INVALID = "Invalid query param: roomId must be a number";
  static readonly URL_PARTICIPANT_ID_INVALID = "Invalid query param: participantId must be a positive number";

  static domElementNotFound(id: string): string {
    return `[DOM] Element not found: #${id}`;
  }

  static readonly EVENT_BUS_HANDLER_FAILED_PREFIX = "EventBus handler failed for event=";
  static readonly PARENT_BRIDGE_POST_MESSAGE_FAILED = "ParentBridge postMessage failed";

  static readonly JANUS_INITIALIZED = "Janus initialized";
  static readonly JANUS_CREATING_SESSION = "Creating Janus session...";
  static readonly JANUS_NOT_READY_STATUS = "Janus not ready";
  static readonly JANUS_NOT_READY_ERROR = "Janus not ready";
  static readonly JANUS_PUBLISHER_DETACH_FAILED = "Publisher detach failed during destroy";
  static readonly JANUS_DESTROY_FAILED = "Janus destroy failed";

  static janusErrorStatus(err: unknown): string {
    return "Janus error: " + JSON.stringify(err);
  }

  static janusSessionCreateError(err: unknown): string {
    return "Janus session create error: " + JSON.stringify(err);
  }

  static janusAttachErrorStatus(err: unknown): string {
    return "Attach error: " + JSON.stringify(err);
  }

  static janusAttachErrorLog(err: unknown): string {
    return "Attach error: " + JSON.stringify(err);
  }

  static readonly MEDIA_LOCAL_VIDEO_PLAY_FAILED = "Local video play failed";
  static readonly MEDIA_STOP_REPLACED_REMOTE_TRACK_FAILED = "Stopping replaced remote track failed";
  static readonly MEDIA_REMOTE_VIDEO_PLAY_FAILED = "Remote video play failed";

  static readonly NETWORK_QUALITY_STATS_SAMPLING_FAILED = "[network-quality] stats sampling failed";
  static readonly NETWORK_QUALITY_DETAILS_ERROR = "src=webrtc-stats error";

  static connectionStatusStatsError(message: string): string {
    return `[connection-status] ${message}`;
  }

  static readonly REMOTE_ATTACH_ERROR_PREFIX = "Remote attach error: ";
  static readonly REMOTE_ANSWER_ERROR_PREFIX = "Remote answer error: ";
  static readonly REMOTE_ATTACH_TIMEOUT_REASON = "attach timeout";
  static readonly REMOTE_HANGUP_REASON_UNKNOWN = "unknown";

  static remoteFeedRetryBlocked(feedId: number, blockedUntilIso: string): string {
    return `Remote feed ${feedId} retry blocked until ${blockedUntilIso}`;
  }

  static remoteFeedRetriesExhausted(feedId: number, maxAttempts: number, reason: string): string {
    return `Remote feed ${feedId} retries exhausted after ${maxAttempts} attempts. Cooldown started. reason=${reason}`;
  }

  static remoteFeedRetryScheduled(feedId: number, attempt: number, maxAttempts: number, delayMs: number, reason: string): string {
    return `Remote feed ${feedId} retry scheduled (${attempt}/${maxAttempts}, delay=${delayMs}ms): ${reason}`;
  }

  static remoteFeedAddSkippedCooldown(feedId: number): string {
    return `Remote feed ${feedId} add skipped during cooldown`;
  }

  static remoteFeedAttachSkippedNotReady(feedId: number): string {
    return `Remote feed ${feedId} attach skipped: Janus session not ready`;
  }

  static remoteFeedAttachTimedOut(feedId: number): string {
    return `Remote feed ${feedId} attach timed out`;
  }

  static remoteFeedDidNotStartInTime(feedId: number): string {
    return `Remote feed ${feedId} did not start media in time`;
  }

  static remoteFeedAttachErrorReason(err: unknown): string {
    return `attach error: ${JSON.stringify(err)}`;
  }

  static remoteFeedPluginError(feedId: number, data: unknown): string {
    return `Remote feed ${feedId} plugin error: ${JSON.stringify(data)}`;
  }

  static remoteFeedHangup(feedId: number, reason: string): string {
    return `Remote feed ${feedId} hangup: ${reason}`;
  }

  static remoteFeedTelemetryParseFailed(feedId: number): string {
    return `Remote feed ${feedId} telemetry parse failed`;
  }

  static remoteFeedDetachFailed(feedId: number): string {
    return `Remote feed ${feedId} detach failed`;
  }

  static readonly VB_NO_CANVAS_2D = "No canvas 2d";
  static readonly VB_NO_SOURCE_CANVAS_2D = "No source canvas 2d";
  static readonly VB_NO_MASK_CANVAS_2D = "No mask canvas 2d";
  static readonly VB_NO_BACKGROUND_CANVAS_2D = "No background canvas 2d";
  static readonly VB_SOURCE_TRACK_UNAVAILABLE = "Virtual background source video track unavailable";
  static readonly VB_INPUT_VIDEO_PLAY_FAILED = "Virtual background input video play failed";
  static readonly VB_SOURCE_RECOVERY_FAILED = "Virtual background source recovery failed";
  static readonly VB_SEGMENTATION_FRAME_FAILED = "Virtual background segmentation frame failed";
  static readonly VB_LOOP_FAILED = "Virtual background loop failed";
  static readonly VB_COMPOSITION_FAILED = "Virtual background composition failed";
  static readonly VB_OUTPUT_FRAME_TIMEOUT = "Virtual background output frame timeout";
  static readonly VB_ENABLED = "Virtual background enabled";
  static readonly VB_DISABLED = "Virtual background disabled";

  static readonly CALL_SERVER_RETRY_LIMIT_REACHED = "Video server call failed. Retry limit reached.";
  static readonly CALL_PEER_RETRY_LIMIT_REACHED = "TURN/peer connection failed. Retry limit reached.";
  static readonly CALL_PLUGIN_ATTACHED_CHECKING_ROOM = "Plugin attached. Checking room...";
  static readonly CALL_PUBLISHER_CLEANUP_RECOVERING = "Publisher cleanup. Recovering media connection...";
  static readonly CALL_ROOM_EXISTS_JOINING = "Room exists. Joining...";
  static readonly CALL_ROOM_NOT_FOUND_CREATING = "Room not found. Creating...";
  static readonly CALL_ROOM_CREATED_JOINING = "Room created. Joining...";
  static readonly CALL_PARTICIPANT_ID_IN_USE = "Participant ID already in use. Use a unique Participant ID and reconnect.";
  static readonly CALL_PARTICIPANT_ID_IN_USE_SECONDARY = "Open call with a unique participant ID.";
  static readonly CALL_AUTHORIZATION_FAILED = "Authorization failed for call join. Please refresh and re-authenticate.";
  static readonly CALL_AUTHORIZATION_FAILED_SECONDARY = "Retry after authentication.";
  static readonly CALL_JOINED_PUBLISHING = "Joined. Publishing...";
  static readonly CALL_REMOTE_VIDEO_UNSTABLE = "Remote video is unstable. Ask participant to reconnect.";
  static readonly CALL_PUBLISH_IGNORED_PLUGIN_NOT_READY = "Publish ignored: plugin not ready";
  static readonly CALL_OFFER_ERROR_RECOVERING = "Offer error. Recovering media path...";
  static readonly CALL_OFFER_ERROR_CONSOLE_TAG = "VCX_OFFER_ERROR";
  static readonly CALL_VIDEO_UNMUTE_SIGNALING_FAILED = "Video unmute signaling failed";
  static readonly CALL_VIDEO_MUTE_SIGNALING_FAILED = "Video mute signaling failed";
  static readonly CALL_VIDEO_TOGGLE_FAILED = "Video toggle failed";
  static readonly CALL_RECORDING_FAILED_ENDING = "Recording failed twice. Ending call.";
  static readonly CALL_RECORDING_STOPPED = "Recording stopped";
  static readonly CALL_RECORDING_START_RETRYING = "Recording start failed. Retrying...";
  static readonly CALL_RECORDING_STOP_RETRYING = "Recording stop failed. Retrying...";
  static readonly CALL_RECORDING_STOP_ON_LEAVE_FAILED = "[recording] stop on leave failed";
  static readonly CALL_LEAVE_SIGNALING_FAILED = "Leave signaling failed";
  static readonly CALL_LEFT = "Left";
  static readonly CALL_LEAVE_ERROR = "Leave error";
  static readonly CALL_SCREEN_SHARE_STARTED = "Screen share started";
  static readonly CALL_SCREEN_SHARE_STOPPED = "Screen share stopped";
  static readonly CALL_DISABLE_SCREEN_BEFORE_VB = "Disable screen share before virtual background";
  static readonly CALL_SCREEN_SHARE_TOGGLE_FAILED = "Screen share toggle failed";
  static readonly CALL_VB_TOGGLE_FAILED = "Virtual background toggle failed";
  static readonly CALL_VB_FALLBACK_TO_CAMERA = "Virtual background failed to stream. Switched back to camera.";
  static readonly CALL_STOP_STALE_CAMERA_TRACK_FAILED = "Stopping stale camera track failed";
  static readonly CALL_CAMERA_ACCESS_FAILED = "Camera access failed";
  static readonly CALL_REPLACE_VIDEO_TRACK_FAILED = "replaceVideoTrack failed";
  static readonly CALL_VIDEO_TRACK_SWITCH_FAILED = "Video track switch failed.";
  static readonly CALL_REPLACE_AUDIO_TRACK_FAILED = "replaceAudioTrack failed";
  static readonly CALL_SCREEN_AUDIO_MIXING_FAILED = "Screen-share audio mixing failed; using microphone only";
  static readonly CALL_STOP_MIXED_AUDIO_TRACK_FAILED = "Stopping mixed audio track failed";
  static readonly CALL_CLOSE_MIXED_AUDIO_CONTEXT_FAILED = "Closing mixed audio context failed";
  static readonly CALL_PUBLISHER_METRICS_FAILED = "Publisher metrics collection failed";
  static readonly CALL_SUBSCRIBER_METRICS_FAILED = "Subscriber metrics collection failed";
  static readonly CALL_MEDIA_SETUP_SET_PARAMETERS_ERROR = "VCX_SET_PARAMETERS_ERROR";
  static readonly CALL_MEDIA_SETUP_SET_PARAMETERS_HOOK_ERROR = "VCX_SET_PARAMETERS_HOOK_ERROR";
  static readonly CALL_CONNECTIVITY_HOOK_ERROR = "VCX_CONNECTIVITY hook error";
  static readonly CALL_FIX_CAMERA_MIC_AND_RECONNECT = "Fix camera/mic issue and reconnect the call.";
  static readonly CALL_SCREEN_VIDEO_TRACK_UNAVAILABLE = "Screen video track unavailable";
  static readonly CALL_CAMERA_MIC_TRACK_UNAVAILABLE = "Camera or microphone track unavailable";
  static readonly CALL_VB_OUTPUT_TRACK_UNAVAILABLE = "Virtual background output track unavailable";
  static readonly CALL_CAMERA_STREAM_UNAVAILABLE_AFTER_INIT = "Camera stream unavailable after initialization";

  static callServerRetrying(attempt: number, maxAttempts: number): string {
    return `Video server call failed. Retrying (${attempt}/${maxAttempts})...`;
  }

  static callPeerRetrying(attempt: number, maxAttempts: number): string {
    return `TURN/peer connection failed. Retrying (${attempt}/${maxAttempts})...`;
  }

  static callRetryExhausted(kind: "server" | "peer", callId: string, roomId: number, reason: string): string {
    return `[retry] ${kind} retries exhausted. callId=${callId} roomId=${roomId} reason=${reason}`;
  }

  static callRetryScheduled(kind: "server" | "peer", attempt: number, maxAttempts: number, callId: string, roomId: number, reason: string): string {
    return `[retry] ${kind} scheduled (${attempt}/${maxAttempts}). callId=${callId} roomId=${roomId} reason=${reason}`;
  }

  static callJoinError(raw: unknown): string {
    return "Join error: " + String(raw);
  }

  static callJoinFailed(callId: string, roomId: number, requestId: string): string {
    return `[join] failed callId=${callId} roomId=${roomId} requestId=${requestId}`;
  }

  static callParticipantIdCollision(callId: string, roomId: number, participantId: string, errorCode: string, detail: string): string {
    return `[join] participant id collision callId=${callId} roomId=${roomId} participantId=${participantId} code=${errorCode} detail=${detail}`;
  }

  static callUnauthorizedJoin(callId: string, roomId: number, errorCode: string, detail: string): string {
    return `[join] unauthorized callId=${callId} roomId=${roomId} code=${errorCode} detail=${detail}`;
  }

  static callRoomMissingAfterCreate(errorCode: string): string {
    return `Room missing after create attempt (code=${errorCode})`;
  }

  static callPublisherJoinError(errorCode: string, detail: string): string {
    return `Publisher join error code=${errorCode} detail=${detail}`;
  }

  static callRoomJoinFailedAfterCreateAttempt(errorCode: string): string {
    return `Room join failed with ${errorCode} after create attempt`;
  }

  static callPublisherHangup(reason: string): string {
    return `Publisher hangup: ${reason}`;
  }

  static callPublisherPluginError(data: unknown): string {
    return `Publisher plugin error: ${JSON.stringify(data)}`;
  }

  static callListParticipantsTimeout(requestSeq: number, roomId: number): string {
    return `listparticipants timeout (request=${requestSeq}, room=${roomId})`;
  }

  static callListParticipantsError(requestSeq: number, err: unknown): string {
    return `listparticipants error (request=${requestSeq}): ${JSON.stringify(err)}`;
  }

  static callRemoteFeedRetryExhausted(callId: string, roomId: number, feedId: number, attempts: number): string {
    return `[remote-feed] retry exhausted callId=${callId} roomId=${roomId} feedId=${feedId} attempts=${attempts}`;
  }

  static callRecordingLog(message: string): string {
    return `[recording] ${message}`;
  }

  static callRecordingStartFailed(attempt: number): string {
    return `[recording] start failed (attempt ${attempt})`;
  }

  static callRecordingStopFailed(attempt: number): string {
    return `[recording] stop failed (attempt ${attempt})`;
  }

  static callRecordingStarted(roomRecordingId: string): string {
    return `Recording started (room): ${roomRecordingId}`;
  }

  static callLeaveErrorStatus(message: string): string {
    return "Leave error: " + message;
  }

  static callOfferErrorReason(err: unknown): string {
    return "Offer error: " + JSON.stringify(err);
  }

  static callRetryStatus(kind: "server" | "peer", attempt: number, maxAttempts: number): string {
    return kind === "server"
      ? ErrorMessages.callServerRetrying(attempt, maxAttempts)
      : ErrorMessages.callPeerRetrying(attempt, maxAttempts);
  }

  static callRetryLimitStatus(kind: "server" | "peer"): string {
    return kind === "server"
      ? ErrorMessages.CALL_SERVER_RETRY_LIMIT_REACHED
      : ErrorMessages.CALL_PEER_RETRY_LIMIT_REACHED;
  }

  static readonly MEDIA_PERMISSION_BLOCKED = "Camera/Mic access blocked. Allow permissions in browser settings, then retry.";
  static readonly MEDIA_DEVICE_MISSING = "Camera or microphone not found. Connect your devices, then retry.";
  static readonly MEDIA_DEVICE_BUSY = "Camera/Mic is busy in another app. Close other apps using them, then retry.";
  static readonly MEDIA_CONSTRAINT_UNSUPPORTED = "Camera/Mic settings are unsupported. Reconnect device or reset browser media settings.";
  static readonly MEDIA_CAMERA_MIC_GENERIC = "Unable to start camera/microphone. Check devices and browser permissions, then retry.";
  static readonly MEDIA_SCREEN_BLOCKED_OR_CANCELED = "Screen share was blocked or canceled. Select a window/screen and allow access.";
  static readonly MEDIA_SCREEN_CANCELED = "Screen share was canceled. Please try sharing again.";
  static readonly MEDIA_SCREEN_UNAVAILABLE_BUSY = "Screen share is unavailable right now. Close blocking apps and retry.";
  static readonly MEDIA_SCREEN_FAILED = "Screen share failed. Please try again.";
}
