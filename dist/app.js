"use strict";
const IMS_MEDIA_CONSTRAINTS_MOCK_PAYLOAD = {
    MEDIA_CONSTRAINTS: {
        WEB_MEDIA_CONSTRAINTS: [
            {
                audio: true,
                video: {
                    width: { min: 310, ideal: 320, max: 320 },
                    frameRate: { max: 20 },
                    aspectRatio: 1.777777778
                }
            },
            {
                audio: true,
                video: {
                    width: { min: 310, ideal: 320 },
                    frameRate: { max: 20 },
                    aspectRatio: 1.777777778
                }
            },
            { audio: true, video: true }
        ],
        WEB_MEDIA_CONSTRAINTS_GU: [
            {
                audio: true,
                video: {
                    width: { min: 620, ideal: 640, max: 640 },
                    frameRate: { max: 20 },
                    aspectRatio: 1.777777778
                }
            },
            {
                audio: true,
                video: {
                    width: { min: 620, ideal: 640 },
                    frameRate: { max: 20 },
                    aspectRatio: 1.777777778
                }
            },
            { audio: true, video: true }
        ],
        MOBILE_MEDIA_CONSTRAINTS: [
            {
                audio: true,
                video: {
                    width: { max: 640 },
                    frameRate: { max: 30 },
                    facingMode: { exact: "user" }
                }
            }
        ]
    },
    PC_CONFIG: {
        iceServers: [
            {
                urls: [
                    "turn:coturn.videocx.io:443?transport=udp",
                    "turns:coturn.videocx.io:443?transport=tcp"
                ],
                username: "1772097225:ecd359ac-2237-42ff-8ddc-764d79d4ea0b",
                credential: "odIkTMlYtpKWHHVZtAxw3a+VxJE="
            },
            {
                urls: ["stun:coturn.videocx.io:443"]
            }
        ]
    },
    PC_CONFIG_FF: {
        iceServers: [
            {
                url: "turn:coturn.videocx.io:443?transport=udp",
                username: "1772097225:ecd359ac-2237-42ff-8ddc-764d79d4ea0b",
                credential: "odIkTMlYtpKWHHVZtAxw3a+VxJE="
            },
            {
                url: "stun:coturn.videocx.io:443"
            }
        ]
    },
    videochat: {
        videoBandwidth: 128000
    },
    chimeMediaConstraints: {
        maxBandwidthKbps: 256,
        employee: {
            desktop: { width: 640, height: 480, frameRate: 20 },
            mobile: { width: 640, height: 480, frameRate: 20 }
        },
        customer: {
            desktop: { width: 640, height: 480, frameRate: 20 },
            mobile: { width: 640, height: 480, frameRate: 20 }
        }
    }
};
const APP_CONFIG = {
    logging: {
        level: "warn"
    },
    janus: {
        initDebug: "warn"
    },
    http: {
        defaultTimeoutMs: 15000
    },
    ims: {
        mediaConstraintsPath: "/ims/users/media-constraints",
        useMockMediaConstraints: true,
        mockMediaConstraintsResponse: {
            name: "VideoConstraint",
            value: JSON.stringify(IMS_MEDIA_CONSTRAINTS_MOCK_PAYLOAD)
        }
    },
    vcx: {
        imsBaseUrl: "https://beta.videocx.io",
        clientId: "101",
        defaultJanusServer: "wss://beta.videocx.io/mstream_janus",
        defaultDisplayName: "Guest"
    },
    videoroom: {
        maxPublishers: 10
    },
    media: {
        bitrateBps: 250000,
        bitrateCap: true,
        maxFramerate: 15,
        minBitrateBps: 32000,
        maxBitrateBps: 1500000,
        minFramerate: 5,
        maxFramerateCap: 30,
        // Ordered by preference. Default: try VP9 first, then fallback to VP8.
        videoCodecPreferenceOrder: ["vp8", "vp9"],
        enableVideoCodecFallback: true
    },
    adaptiveVideo: {
        enabled: true,
        sampleIntervalMs: 3000,
        lowEnterKbps: 60,
        lowExitKbps: 110,
        lowEnterSamples: 2,
        lowExitSamples: 4,
        likelyDisconnectKbps: 35,
        likelyDisconnectSamples: 3,
        wsProtection: {
            participantSyncIntervalMsNormal: 8000,
            participantSyncIntervalMsLow: 20000
        },
        profiles: {
            customer: {
                normal: {
                    width: 640,
                    height: 480,
                    maxFramerate: 10,
                    bitrateBps: 110000
                },
                low: {
                    width: 640,
                    height: 480,
                    maxFramerate: 10,
                    bitrateBps: 80000
                }
            },
            agent: {
                normal: {
                    width: 480,
                    height: 360,
                    maxFramerate: 5,
                    bitrateBps: 90000
                },
                low: {
                    width: 320,
                    height: 240,
                    maxFramerate: 5,
                    bitrateBps: 50000
                }
            }
        }
    },
    call: {
        reconnectDelayMs: 1000,
        participantSyncIntervalMs: 5000,
        participantSyncCooldownMs: 2500,
        participantSyncRequestTimeoutMs: 4500,
        remoteFeedRetryDelayMs: 1200,
        remoteFeedRetryMaxAttempts: 5,
        remoteFeedRetryCooldownMs: 15000,
        remoteFeedRetryMaxDelayMs: 7000,
        remoteFeedRetryJitterMs: 400,
        remoteFeedAttachTimeoutMs: 10000,
        remoteFeedStartTimeoutMs: 12000,
        retry: {
            serverMaxAttempts: 3,
            serverDelayMs: 3000,
            peerMaxAttempts: 3,
            peerDelayMs: 3000
        }
    },
    ui: {
        remoteFallbackRefreshMs: 2500,
        remoteVideoStallThresholdMs: 4000
    },
    virtualBackground: {
        maskMode: "auto",
        maskAutoConfirmFrames: 4,
        maskAutoProbeFrames: 15,
        maskAutoMinDiff: 10
    },
    recording: {
        folderPath: "/opt/efs-janus-app/dev/VideoRecDownloads",
        autoStartParticipantThreshold: 2
    },
    networkQuality: {
        sampleIntervalMs: 3000,
        useSimulatedFallback: false,
        participantPanel: {
            sampleIntervalMs: 2000,
            slowLinkHoldMs: 12000,
            popupBreakpointPx: 900,
            thresholdsKbps: {
                lowMax: 50,
                mediumMax: 100
            }
        },
        simulated: {
            rttBaseMs: 30,
            rttSpreadMs: 200,
            jitterBaseMs: 3,
            jitterSpreadMs: 60,
            lossMaxPct: 8,
            bitrateBaseKbps: 150,
            bitrateSpreadKbps: 1000
        },
        thresholds: {
            rttGoodMs: 120,
            jitterGoodMs: 30,
            lossGoodPct: 2,
            bitrateGoodKbps: 400
        }
    },
    mediaTelemetry: {
        sampleIntervalMs: 1000,
        enablePeerNetworkTelemetry: true,
        networkTelemetryIntervalMs: 5000,
        stallWindowMs: 3500,
        peerTelemetryFreshnessMs: 6000,
        enablePeerTelemetry: true
    },
    connectionStatus: {
        tickIntervalMs: 1000,
        rotationMinMs: 6000,
        rotationMaxMs: 8000,
        statsIntervalConnectingMs: 3000,
        statsIntervalConnectedMs: 7000,
        highRttMs: 1200,
        highPacketLossThreshold: 0.08,
        packetLossMinPackets: 100,
        bytesGrowthThreshold: 1024,
        mediaFlowRecentMs: 9000,
        relayRecentMs: 12000,
        candidateSwitchRecentMs: 12000,
        localSlowCheckingMs: 12000,
        localSlowStatsMs: 6000,
        relayEarlyJoinWindowMs: 25000,
        relayEarlyThresholdMs: 8000,
        remoteSlowWaitMs: 10000,
        disconnectedRetryMs: 4000
    }
};
class ErrorCodes {
}
ErrorCodes.JANUS_ROOM_NOT_FOUND = 426;
ErrorCodes.JANUS_UNAUTHORIZED = 433;
ErrorCodes.JANUS_FORBIDDEN = 428;
ErrorCodes.JANUS_PARTICIPANT_ID_COLLISION = 436;
class ErrorMessages {
    static domElementNotFound(id) {
        return `[DOM] Element not found: #${id}`;
    }
    static janusErrorStatus(err) {
        return "Janus error: " + JSON.stringify(err);
    }
    static janusSessionCreateError(err) {
        return "Janus session create error: " + JSON.stringify(err);
    }
    static janusAttachErrorStatus(err) {
        return "Attach error: " + JSON.stringify(err);
    }
    static janusAttachErrorLog(err) {
        return "Attach error: " + JSON.stringify(err);
    }
    static connectionStatusStatsError(message) {
        return `[connection-status] ${message}`;
    }
    static remoteFeedRetryBlocked(feedId, blockedUntilIso) {
        return `Remote feed ${feedId} retry blocked until ${blockedUntilIso}`;
    }
    static remoteFeedRetriesExhausted(feedId, maxAttempts, reason) {
        return `Remote feed ${feedId} retries exhausted after ${maxAttempts} attempts. Cooldown started. reason=${reason}`;
    }
    static remoteFeedRetryScheduled(feedId, attempt, maxAttempts, delayMs, reason) {
        return `Remote feed ${feedId} retry scheduled (${attempt}/${maxAttempts}, delay=${delayMs}ms): ${reason}`;
    }
    static remoteFeedAddSkippedCooldown(feedId) {
        return `Remote feed ${feedId} add skipped during cooldown`;
    }
    static remoteFeedAttachSkippedNotReady(feedId) {
        return `Remote feed ${feedId} attach skipped: Janus session not ready`;
    }
    static remoteFeedAttachTimedOut(feedId) {
        return `Remote feed ${feedId} attach timed out`;
    }
    static remoteFeedDidNotStartInTime(feedId) {
        return `Remote feed ${feedId} did not start media in time`;
    }
    static remoteFeedAttachErrorReason(err) {
        return `attach error: ${JSON.stringify(err)}`;
    }
    static remoteFeedPluginError(feedId, data) {
        return `Remote feed ${feedId} plugin error: ${JSON.stringify(data)}`;
    }
    static remoteFeedHangup(feedId, reason) {
        return `Remote feed ${feedId} hangup: ${reason}`;
    }
    static remoteFeedTelemetryParseFailed(feedId) {
        return `Remote feed ${feedId} telemetry parse failed`;
    }
    static remoteFeedDetachFailed(feedId) {
        return `Remote feed ${feedId} detach failed`;
    }
    static callServerRetrying(attempt, maxAttempts) {
        return `Video server call failed. Retrying (${attempt}/${maxAttempts})...`;
    }
    static callPeerRetrying(attempt, maxAttempts) {
        return `TURN/peer connection failed. Retrying (${attempt}/${maxAttempts})...`;
    }
    static callRetryExhausted(kind, callId, roomId, reason) {
        return `[retry] ${kind} retries exhausted. callId=${callId} roomId=${roomId} reason=${reason}`;
    }
    static callRetryScheduled(kind, attempt, maxAttempts, callId, roomId, reason) {
        return `[retry] ${kind} scheduled (${attempt}/${maxAttempts}). callId=${callId} roomId=${roomId} reason=${reason}`;
    }
    static callJoinError(raw) {
        return "Join error: " + String(raw);
    }
    static callJoinFailed(callId, roomId, requestId) {
        return `[join] failed callId=${callId} roomId=${roomId} requestId=${requestId}`;
    }
    static callParticipantIdCollision(callId, roomId, participantId, errorCode, detail) {
        return `[join] participant id collision callId=${callId} roomId=${roomId} participantId=${participantId} code=${errorCode} detail=${detail}`;
    }
    static callUnauthorizedJoin(callId, roomId, errorCode, detail) {
        return `[join] unauthorized callId=${callId} roomId=${roomId} code=${errorCode} detail=${detail}`;
    }
    static callRoomMissingAfterCreate(errorCode) {
        return `Room missing after create attempt (code=${errorCode})`;
    }
    static callPublisherJoinError(errorCode, detail) {
        return `Publisher join error code=${errorCode} detail=${detail}`;
    }
    static callRoomJoinFailedAfterCreateAttempt(errorCode) {
        return `Room join failed with ${errorCode} after create attempt`;
    }
    static callPublisherHangup(reason) {
        return `Publisher hangup: ${reason}`;
    }
    static callPublisherPluginError(data) {
        return `Publisher plugin error: ${JSON.stringify(data)}`;
    }
    static callListParticipantsTimeout(requestSeq, roomId) {
        return `listparticipants timeout (request=${requestSeq}, room=${roomId})`;
    }
    static callListParticipantsError(requestSeq, err) {
        return `listparticipants error (request=${requestSeq}): ${JSON.stringify(err)}`;
    }
    static callRemoteFeedRetryExhausted(callId, roomId, feedId, attempts) {
        return `[remote-feed] retry exhausted callId=${callId} roomId=${roomId} feedId=${feedId} attempts=${attempts}`;
    }
    static callRecordingLog(message) {
        return `[recording] ${message}`;
    }
    static callRecordingStartFailed(attempt) {
        return `[recording] start failed (attempt ${attempt})`;
    }
    static callRecordingStopFailed(attempt) {
        return `[recording] stop failed (attempt ${attempt})`;
    }
    static callRecordingStarted(roomRecordingId) {
        return `Recording started (room): ${roomRecordingId}`;
    }
    static callLeaveErrorStatus(message) {
        return "Leave error: " + message;
    }
    static callOfferErrorReason(err) {
        return "Offer error: " + JSON.stringify(err);
    }
    static callRetryStatus(kind, attempt, maxAttempts) {
        return kind === "server"
            ? ErrorMessages.callServerRetrying(attempt, maxAttempts)
            : ErrorMessages.callPeerRetrying(attempt, maxAttempts);
    }
    static callRetryLimitStatus(kind) {
        return kind === "server"
            ? ErrorMessages.CALL_SERVER_RETRY_LIMIT_REACHED
            : ErrorMessages.CALL_PEER_RETRY_LIMIT_REACHED;
    }
}
ErrorMessages.URL_GROUP_ID_ALERT = "This call link is missing a group ID, so we can't join yet. Please open the full link again or add ?groupId=1234 to the URL.";
ErrorMessages.URL_GROUP_ID_MISSING = "Missing required query param: groupId";
ErrorMessages.URL_GROUP_ID_INVALID = "Invalid query param: groupId must be a number";
ErrorMessages.URL_PARTICIPANT_ID_INVALID = "Invalid query param: participantId must be a positive number";
ErrorMessages.RMS_MEETING_CREATE_FAILED = "Unable to create meeting from group. Please try again.";
ErrorMessages.RMS_MEETING_ID_INVALID = "RMS response is missing a valid meetingId";
ErrorMessages.RMS_RECORDING_CREATE_FAILED = "Unable to create recording from meeting. Please try again.";
ErrorMessages.RMS_RECORDING_ID_INVALID = "RMS response is missing a valid recordingId";
ErrorMessages.EVENT_BUS_HANDLER_FAILED_PREFIX = "EventBus handler failed for event=";
ErrorMessages.PARENT_BRIDGE_POST_MESSAGE_FAILED = "ParentBridge postMessage failed";
ErrorMessages.JANUS_INITIALIZED = "Janus initialized";
ErrorMessages.JANUS_CREATING_SESSION = "Creating Janus session...";
ErrorMessages.JANUS_NOT_READY_STATUS = "Janus not ready";
ErrorMessages.JANUS_NOT_READY_ERROR = "Janus not ready";
ErrorMessages.JANUS_PUBLISHER_DETACH_FAILED = "Publisher detach failed during destroy";
ErrorMessages.JANUS_DESTROY_FAILED = "Janus destroy failed";
ErrorMessages.MEDIA_LOCAL_VIDEO_PLAY_FAILED = "Local video play failed";
ErrorMessages.MEDIA_STOP_REPLACED_REMOTE_TRACK_FAILED = "Stopping replaced remote track failed";
ErrorMessages.MEDIA_REMOTE_VIDEO_PLAY_FAILED = "Remote video play failed";
ErrorMessages.NETWORK_QUALITY_STATS_SAMPLING_FAILED = "[network-quality] stats sampling failed";
ErrorMessages.NETWORK_QUALITY_DETAILS_ERROR = "src=webrtc-stats error";
ErrorMessages.REMOTE_ATTACH_ERROR_PREFIX = "Remote attach error: ";
ErrorMessages.REMOTE_ANSWER_ERROR_PREFIX = "Remote answer error: ";
ErrorMessages.REMOTE_ATTACH_TIMEOUT_REASON = "attach timeout";
ErrorMessages.REMOTE_HANGUP_REASON_UNKNOWN = "unknown";
ErrorMessages.VB_NO_CANVAS_2D = "No canvas 2d";
ErrorMessages.VB_NO_SOURCE_CANVAS_2D = "No source canvas 2d";
ErrorMessages.VB_NO_MASK_CANVAS_2D = "No mask canvas 2d";
ErrorMessages.VB_NO_BACKGROUND_CANVAS_2D = "No background canvas 2d";
ErrorMessages.VB_SOURCE_TRACK_UNAVAILABLE = "Virtual background source video track unavailable";
ErrorMessages.VB_INPUT_VIDEO_PLAY_FAILED = "Virtual background input video play failed";
ErrorMessages.VB_SOURCE_RECOVERY_FAILED = "Virtual background source recovery failed";
ErrorMessages.VB_SEGMENTATION_FRAME_FAILED = "Virtual background segmentation frame failed";
ErrorMessages.VB_LOOP_FAILED = "Virtual background loop failed";
ErrorMessages.VB_COMPOSITION_FAILED = "Virtual background composition failed";
ErrorMessages.VB_OUTPUT_FRAME_TIMEOUT = "Virtual background output frame timeout";
ErrorMessages.VB_ENABLED = "Virtual background enabled";
ErrorMessages.VB_DISABLED = "Virtual background disabled";
ErrorMessages.CALL_SERVER_RETRY_LIMIT_REACHED = "Video server call failed. Retry limit reached.";
ErrorMessages.CALL_PEER_RETRY_LIMIT_REACHED = "TURN/peer connection failed. Retry limit reached.";
ErrorMessages.CALL_PLUGIN_ATTACHED_CHECKING_ROOM = "Plugin attached. Checking room...";
ErrorMessages.CALL_PUBLISHER_CLEANUP_RECOVERING = "Publisher cleanup. Recovering media connection...";
ErrorMessages.CALL_ROOM_EXISTS_JOINING = "Room exists. Joining...";
ErrorMessages.CALL_ROOM_NOT_FOUND_CREATING = "Room not found. Creating...";
ErrorMessages.CALL_ROOM_CREATED_JOINING = "Room created. Joining...";
ErrorMessages.CALL_PARTICIPANT_ID_IN_USE = "Participant ID already in use. Use a unique Participant ID and reconnect.";
ErrorMessages.CALL_PARTICIPANT_ID_IN_USE_SECONDARY = "Open call with a unique participant ID.";
ErrorMessages.CALL_AUTHORIZATION_FAILED = "Authorization failed for call join. Please refresh and re-authenticate.";
ErrorMessages.CALL_AUTHORIZATION_FAILED_SECONDARY = "Retry after authentication.";
ErrorMessages.CALL_JOINED_PUBLISHING = "Joined. Publishing...";
ErrorMessages.CALL_REMOTE_VIDEO_UNSTABLE = "Remote video is unstable. Ask participant to reconnect.";
ErrorMessages.CALL_PUBLISH_IGNORED_PLUGIN_NOT_READY = "Publish ignored: plugin not ready";
ErrorMessages.CALL_OFFER_ERROR_RECOVERING = "Offer error. Recovering media path...";
ErrorMessages.CALL_OFFER_ERROR_CONSOLE_TAG = "VCX_OFFER_ERROR";
ErrorMessages.CALL_AUDIO_UNMUTE_SIGNALING_FAILED = "Audio unmute signaling failed";
ErrorMessages.CALL_AUDIO_MUTE_SIGNALING_FAILED = "Audio mute signaling failed";
ErrorMessages.CALL_AUDIO_TOGGLE_FAILED = "Audio toggle failed";
ErrorMessages.CALL_VIDEO_UNMUTE_SIGNALING_FAILED = "Video unmute signaling failed";
ErrorMessages.CALL_VIDEO_MUTE_SIGNALING_FAILED = "Video mute signaling failed";
ErrorMessages.CALL_VIDEO_TOGGLE_FAILED = "Video toggle failed";
ErrorMessages.CALL_RECORDING_FAILED_ENDING = "Recording failed twice. Ending call.";
ErrorMessages.CALL_RECORDING_STOPPED = "Recording stopped";
ErrorMessages.CALL_RECORDING_START_RETRYING = "Recording start failed. Retrying...";
ErrorMessages.CALL_RECORDING_STOP_RETRYING = "Recording stop failed. Retrying...";
ErrorMessages.CALL_RECORDING_STOP_ON_LEAVE_FAILED = "[recording] stop on leave failed";
ErrorMessages.CALL_LEAVE_SIGNALING_FAILED = "Leave signaling failed";
ErrorMessages.CALL_LEFT = "Left";
ErrorMessages.CALL_LEAVE_ERROR = "Leave error";
ErrorMessages.CALL_SCREEN_SHARE_STARTED = "Screen share started";
ErrorMessages.CALL_SCREEN_SHARE_STOPPED = "Screen share stopped";
ErrorMessages.CALL_DISABLE_SCREEN_BEFORE_VB = "Disable screen share before virtual background";
ErrorMessages.CALL_SCREEN_SHARE_TOGGLE_FAILED = "Screen share toggle failed";
ErrorMessages.CALL_VB_TOGGLE_FAILED = "Virtual background toggle failed";
ErrorMessages.CALL_VB_FALLBACK_TO_CAMERA = "Virtual background failed to stream. Switched back to camera.";
ErrorMessages.CALL_STOP_STALE_CAMERA_TRACK_FAILED = "Stopping stale camera track failed";
ErrorMessages.CALL_CAMERA_ACCESS_FAILED = "Camera access failed";
ErrorMessages.CALL_REPLACE_VIDEO_TRACK_FAILED = "replaceVideoTrack failed";
ErrorMessages.CALL_VIDEO_TRACK_SWITCH_FAILED = "Video track switch failed.";
ErrorMessages.CALL_REPLACE_AUDIO_TRACK_FAILED = "replaceAudioTrack failed";
ErrorMessages.CALL_SCREEN_AUDIO_MIXING_FAILED = "Screen-share audio mixing failed; using microphone only";
ErrorMessages.CALL_STOP_MIXED_AUDIO_TRACK_FAILED = "Stopping mixed audio track failed";
ErrorMessages.CALL_CLOSE_MIXED_AUDIO_CONTEXT_FAILED = "Closing mixed audio context failed";
ErrorMessages.CALL_PUBLISHER_METRICS_FAILED = "Publisher metrics collection failed";
ErrorMessages.CALL_SUBSCRIBER_METRICS_FAILED = "Subscriber metrics collection failed";
ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_ERROR = "VCX_SET_PARAMETERS_ERROR";
ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_HOOK_ERROR = "VCX_SET_PARAMETERS_HOOK_ERROR";
ErrorMessages.CALL_CONNECTIVITY_HOOK_ERROR = "VCX_CONNECTIVITY hook error";
ErrorMessages.CALL_FIX_CAMERA_MIC_AND_RECONNECT = "Fix camera/mic issue and reconnect the call.";
ErrorMessages.CALL_SCREEN_VIDEO_TRACK_UNAVAILABLE = "Screen video track unavailable";
ErrorMessages.CALL_CAMERA_MIC_TRACK_UNAVAILABLE = "Camera or microphone track unavailable";
ErrorMessages.CALL_VB_OUTPUT_TRACK_UNAVAILABLE = "Virtual background output track unavailable";
ErrorMessages.CALL_CAMERA_STREAM_UNAVAILABLE_AFTER_INIT = "Camera stream unavailable after initialization";
ErrorMessages.MEDIA_PERMISSION_BLOCKED = "Camera/Mic access blocked. Allow permissions in browser settings, then retry.";
ErrorMessages.MEDIA_DEVICE_MISSING = "Camera or microphone not found. Connect your devices, then retry.";
ErrorMessages.MEDIA_DEVICE_BUSY = "Camera/Mic is busy in another app. Close other apps using them, then retry.";
ErrorMessages.MEDIA_CONSTRAINT_UNSUPPORTED = "Camera/Mic settings are unsupported. Reconnect device or reset browser media settings.";
ErrorMessages.MEDIA_CAMERA_MIC_GENERIC = "Unable to start camera/microphone. Check devices and browser permissions, then retry.";
ErrorMessages.MEDIA_SCREEN_BLOCKED_OR_CANCELED = "Screen share was blocked or canceled. Select a window/screen and allow access.";
ErrorMessages.MEDIA_SCREEN_CANCELED = "Screen share was canceled. Please try sharing again.";
ErrorMessages.MEDIA_SCREEN_UNAVAILABLE_BUSY = "Screen share is unavailable right now. Close blocking apps and retry.";
ErrorMessages.MEDIA_SCREEN_FAILED = "Screen share failed. Please try again.";
class Logger {
    constructor(statusEl, infoEl) {
        this.statusEl = statusEl;
        this.infoEl = infoEl;
        Logger.instance = this;
    }
    static setUserName(name) {
        Logger.userName = (name && name.trim()) ? name.trim() : "User";
        Logger.user(`Display name set to ${Logger.userName}`);
    }
    static setRemoteName(name) {
        Logger.remoteName = (name && name.trim()) ? name.trim() : "Remote";
        Logger.remote(`Remote name set`);
    }
    static setLevel(level) {
        Logger.level = level;
    }
    static canLog(level) {
        return Logger.LEVEL_PRIORITY[level] >= Logger.LEVEL_PRIORITY[Logger.level];
    }
    // Instance UI updates
    setStatus(msg) {
        if (this.statusEl) {
            this.statusEl.textContent = msg;
            this.statusEl.style.color = Logger.STATUS_COLOR_DEFAULT;
        }
        Logger.user(msg);
    }
    setInfo(msg) {
        if (this.infoEl)
            this.infoEl.textContent = msg;
        if (msg)
            Logger.flow(msg);
    }
    setErrorStatus(msg) {
        if (this.statusEl) {
            this.statusEl.textContent = msg;
            this.statusEl.style.color = Logger.STATUS_COLOR_ERROR;
        }
        Logger.user(msg);
    }
    // Static UI updates (backward compatible)
    static setStatus(msg) {
        if (Logger.instance) {
            Logger.instance.setStatus(msg);
            return;
        }
        Logger.user(msg);
    }
    static setInfo(msg) {
        if (Logger.instance) {
            Logger.instance.setInfo(msg);
            return;
        }
        Logger.flow(msg);
    }
    static info(msg) { Logger.setInfo(msg); }
    static warn(msg) {
        if (!Logger.canLog("warn"))
            return;
        console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#f59e0b;font-weight:bold");
    }
    static error(msg, err) {
        if (!Logger.canLog("error"))
            return;
        console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#fb7185;font-weight:bold");
        if (err)
            console.error(err);
        if (Logger.instance) {
            Logger.instance.setErrorStatus(msg);
            return;
        }
        Logger.user(msg);
    }
    // Friendly narration logs
    static user(msg, data) {
        if (!Logger.canLog("info"))
            return;
        console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#22c55e;font-weight:bold", data ?? "");
    }
    static remote(msg, data) {
        if (!Logger.canLog("info"))
            return;
        console.log(`%cRemote(${Logger.remoteName}): ${msg}`, "color:#60a5fa;font-weight:bold", data ?? "");
    }
    static net(msg, data) {
        if (!Logger.canLog("debug"))
            return;
        console.log(`%cNet: ${msg}`, "color:#f59e0b;font-weight:bold", data ?? "");
    }
    static flow(msg, data) {
        if (!Logger.canLog("debug"))
            return;
        console.log(`%cFlow: ${msg}`, "color:#a78bfa;font-weight:bold", data ?? "");
    }
}
Logger.instance = null;
Logger.STATUS_COLOR_DEFAULT = "#111827";
Logger.STATUS_COLOR_ERROR = "#dc2626";
Logger.userName = "User";
Logger.remoteName = "Remote";
Logger.level = APP_CONFIG.logging.level;
Logger.LEVEL_PRIORITY = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 50
};
class EventBus {
    constructor() {
        this.handlers = new Map();
    }
    on(event, h) {
        if (!this.handlers.has(event))
            this.handlers.set(event, new Set());
        this.handlers.get(event).add(h);
    }
    emit(event, payload) {
        const hs = this.handlers.get(event);
        if (!hs)
            return;
        hs.forEach(h => { try {
            h(payload);
        }
        catch (e) {
            Logger.error(`${ErrorMessages.EVENT_BUS_HANDLER_FAILED_PREFIX}${event}`, e);
        } });
    }
}
class UrlConfig {
    static getString(k, fb = "") {
        const v = new URLSearchParams(window.location.search).get(k);
        return v && v.trim() ? v.trim() : fb;
    }
    static getNumber(k, fb) {
        const s = this.getString(k, "");
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : fb;
    }
    static getVcxServer() {
        return {
            server: APP_CONFIG.vcx.imsBaseUrl,
            client_id: APP_CONFIG.vcx.clientId
        };
    }
    static getVcxVideoConfig() {
        return {
            bitrate_bps: APP_CONFIG.media.bitrateBps,
            bitrate_cap: APP_CONFIG.media.bitrateCap,
            max_framerate: APP_CONFIG.media.maxFramerate
        };
    }
    static buildJoinConfig() {
        const groupIdRaw = this.getString("groupId", "");
        if (!groupIdRaw) {
            alert(ErrorMessages.URL_GROUP_ID_ALERT);
            throw new Error(ErrorMessages.URL_GROUP_ID_MISSING);
        }
        const groupId = parseInt(groupIdRaw, 10);
        if (!Number.isFinite(groupId)) {
            alert(ErrorMessages.URL_GROUP_ID_ALERT);
            throw new Error(ErrorMessages.URL_GROUP_ID_INVALID);
        }
        const participantIdRaw = this.getString("participantId", "");
        let participantId = undefined;
        if (participantIdRaw) {
            const parsedParticipantId = parseInt(participantIdRaw, 10);
            if (!Number.isFinite(parsedParticipantId) || parsedParticipantId <= 0) {
                throw new Error(ErrorMessages.URL_PARTICIPANT_ID_INVALID);
            }
            participantId = parsedParticipantId;
        }
        return {
            server: this.getString("server", APP_CONFIG.vcx.defaultJanusServer),
            groupId,
            display: this.getString("name", APP_CONFIG.vcx.defaultDisplayName),
            participantId
        };
    }
}
const CONNECTION_ROTATION_MIN_MS = APP_CONFIG.connectionStatus.rotationMinMs;
const CONNECTION_ROTATION_MAX_MS = APP_CONFIG.connectionStatus.rotationMaxMs;
const CONNECTION_MESSAGES = {
    INIT: {
        owner: "SYSTEM",
        severity: "info",
        rotate: false,
        primary: ["Getting ready..."],
        secondary: ["Preparing secure call setup."]
    },
    MEDIA_PREP: {
        owner: "SYSTEM",
        severity: "info",
        rotate: true,
        primary: [
            "Preparing camera and microphone...",
            "Setting up your media devices...",
            "Finalizing media permissions..."
        ],
        secondary: [
            "This usually takes a few seconds.",
            "Checking browser access to media devices.",
            "Almost done."
        ]
    },
    NEGOTIATING: {
        owner: "SYSTEM",
        severity: "info",
        rotate: true,
        primary: [
            "Connecting your call...",
            "Negotiating secure media channels...",
            "Establishing video path..."
        ],
        secondary: [
            "Please stay on this screen.",
            "Optimizing signaling and media routing.",
            "Finalizing connection details."
        ]
    },
    WAITING_REMOTE: {
        owner: "SYSTEM",
        severity: "info",
        rotate: true,
        primary: [
            "Waiting for the other participant...",
            "Waiting for participant to join...",
            "Standing by for remote join..."
        ],
        secondary: [
            "Keep this screen open while they join.",
            "Share the link if they have not joined yet.",
            "This screen will update automatically."
        ]
    },
    NETWORK_CHECK: {
        owner: "SYSTEM",
        severity: "info",
        rotate: true,
        primary: [
            "Checking network quality...",
            "Validating connection stability...",
            "Testing the best connection route..."
        ],
        secondary: [
            "This helps us keep video stable.",
            "Trying to improve call reliability.",
            "Connection is still being tuned."
        ]
    },
    LOCAL_SLOW: {
        owner: "LOCAL",
        severity: "warn",
        rotate: true,
        primary: [
            "Your network seems slow...",
            "Your connection is unstable right now...",
            "Your upload speed is lower than required..."
        ],
        secondary: [
            "Try a stronger network or pause heavy downloads.",
            "The other participant may see delayed video.",
            "We are still trying to stabilize your connection."
        ]
    },
    REMOTE_SLOW: {
        owner: "REMOTE",
        severity: "warn",
        rotate: true,
        primary: [
            "Other participant's network is slow...",
            "Waiting for the other participant's browser to send video...",
            "Still waiting for the participant's network..."
        ],
        secondary: [
            "Your connection looks active. Waiting on remote media.",
            "The other side may need a few more seconds.",
            "Their video should appear once their network stabilizes."
        ]
    },
    OPTIMIZING: {
        owner: "SYSTEM",
        severity: "info",
        rotate: true,
        primary: [
            "Switching to a more stable connection...",
            "Optimizing route for better call quality...",
            "Adjusting network path for stability..."
        ],
        secondary: [
            "You may notice a brief quality change.",
            "Using fallback routing to keep call alive.",
            "Stability should improve shortly."
        ]
    },
    CONNECTED: {
        owner: "NEUTRAL",
        severity: "info",
        rotate: false,
        primary: ["Connected"],
        secondary: ["Video and audio are live."]
    },
    DEGRADED: {
        owner: "SYSTEM",
        severity: "warn",
        rotate: true,
        primary: [
            "Connection is unstable...",
            "Call quality is temporarily degraded...",
            "Recovering from network instability..."
        ],
        secondary: [
            "Trying to restore stable media.",
            "You may see temporary freezes.",
            "Automatic recovery is in progress."
        ]
    },
    SERVER_RETRYING: {
        owner: "SYSTEM",
        severity: "warn",
        rotate: true,
        primary: [
            "Video server call failed. Retrying...",
            "Unable to reach video server. Retrying...",
            "Reconnecting to video server..."
        ],
        secondary: [
            "Please stay on this screen.",
            "Trying a fresh server session now.",
            "Session recovery is in progress."
        ]
    },
    PEER_RETRYING: {
        owner: "SYSTEM",
        severity: "warn",
        rotate: true,
        primary: [
            "Peer connection failed. Retrying...",
            "TURN/ICE connection failed. Retrying...",
            "Rebuilding media connection..."
        ],
        secondary: [
            "Trying a new media path now.",
            "Refreshing peer connectivity.",
            "Call media recovery is in progress."
        ]
    },
    RETRYING: {
        owner: "SYSTEM",
        severity: "warn",
        rotate: true,
        primary: [
            "Reconnecting call...",
            "Trying to recover connection...",
            "Attempting a new network route..."
        ],
        secondary: [
            "Please stay on this screen.",
            "This usually resolves in a few seconds.",
            "Session recovery is in progress."
        ]
    },
    FAILED: {
        owner: "SYSTEM",
        severity: "error",
        rotate: false,
        primary: ["Connection failed"],
        secondary: ["Please reconnect to continue the call."]
    }
};
class ParentBridge {
    emit(evt) {
        try {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(evt, "*");
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.PARENT_BRIDGE_POST_MESSAGE_FAILED, e);
        }
    }
    onCommand(cb) {
        window.addEventListener("message", (ev) => {
            const d = ev.data;
            if (d && d.type)
                cb(d);
        });
    }
}
// import { Cookie } from "./Cookie";
// import { Correlation } from "./Correlation";
// import { HttpError } from "./HttpError";
// import type { HttpRequest, HttpResponse } from "./HttpTypes";
/**
 * VCX browser HTTP client:
 * - Sends cookies (credentials: include) by default (needed for IMS/OWB token cookies)
 * - Adds X-Request-Id and X-XSRF-Token (from cookies) automatically when available
 * - Adds client-id header
 * - Provides timeout via AbortController
 * - Normalizes errors to HttpError
 */
class HttpClient {
    constructor(baseUrl, clientId, defaultTimeoutMs = APP_CONFIG.http.defaultTimeoutMs) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    async request(req) {
        const requestId = Correlation.newId();
        const url = this.buildUrl(this.baseUrl, req.path, req.query);
        const controller = new AbortController();
        const timeoutMs = req.timeoutMs ?? this.defaultTimeoutMs;
        const t0 = performance.now();
        const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);
        const xsrf = Cookie.get("xsrf-token") ||
            Cookie.get("XSRF-TOKEN") ||
            "";
        const headers = {
            "accept": "application/json",
            ...(req.body !== undefined ? { "content-type": "application/json; charset=utf-8" } : {}),
            "client-id": this.clientId,
            "x-request-id": requestId,
            ...(xsrf ? { "x-xsrf-token": xsrf } : {}),
            ...(req.headers ?? {}),
        };
        try {
            const res = await fetch(url, {
                method: req.method,
                headers,
                body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
                credentials: req.credentials ?? "include",
                signal: controller.signal,
            });
            const ms = Math.round(performance.now() - t0);
            const text = await res.text().catch(() => "");
            const data = text ? this.safeJson(text) : null;
            if (!res.ok) {
                throw new HttpError(`HTTP ${res.status} ${req.method} ${req.path}`, res.status, requestId, url, data);
            }
            return { status: res.status, data: data, headers: res.headers, requestId, url, ms };
        }
        catch (e) {
            const ms = Math.round(performance.now() - t0);
            if (e?.name === "AbortError") {
                throw new HttpError(`Timeout (${timeoutMs}ms) ${req.method} ${req.path}`, 408, requestId, url, { timeoutMs, ms });
            }
            if (e instanceof HttpError)
                throw e;
            throw new HttpError(`Network error ${req.method} ${req.path}`, undefined, requestId, url, e);
        }
        finally {
            window.clearTimeout(timeoutHandle);
        }
    }
    async getJson(path, query, headers) {
        return this.request({ method: "GET", path, query, headers });
    }
    buildUrl(baseUrl, path, query) {
        const u = new URL(path, baseUrl);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v === undefined || v === null)
                    continue;
                u.searchParams.set(k, String(v));
            }
        }
        return u.toString();
    }
    safeJson(text) {
        try {
            return JSON.parse(text);
        }
        catch {
            return text;
        }
    }
}
// import { HttpClient } from "../../http/HttpClient";
// import type { ImsSettingRow, MediaConstraintsPayload } from "./ims.types";
class ImsClient {
    constructor(http) {
        this.http = http;
    }
    /**
     * GET /ims/users/media-constraints
     * Returns row with a JSON string in `value`. We parse it and return the payload.
     */
    async getMediaConstraints() {
        if (APP_CONFIG.ims.useMockMediaConstraints) {
            const row = APP_CONFIG.ims.mockMediaConstraintsResponse;
            return JSON.parse(row.value);
        }
        const res = await this.http.getJson(APP_CONFIG.ims.mediaConstraintsPath);
        const row = res.data;
        // value is a JSON string (escaped)
        const payload = JSON.parse(row.value);
        return payload;
    }
}
/**
 * Pick best constraint object for browser/device.
 * You can tweak strategy later (e.g., based on isMobile, isSafari, bandwidth, etc.)
 */
function pickMediaConstraints(payload, isMobile) {
    const mc = payload.MEDIA_CONSTRAINTS ?? {};
    if (isMobile) {
        const list = mc.MOBILE_MEDIA_CONSTRAINTS ?? [];
        return list[0] ?? { audio: true, video: true };
    }
    const list = mc.WEB_MEDIA_CONSTRAINTS ?? [];
    return list[0] ?? { audio: true, video: true };
}
class RmsClient {
    constructor(http) {
        this.http = http;
    }
    async createMeetingByGroup(groupId) {
        const body = {
            groupId: null,
            meetingType: 1,
            to: groupId,
            recordingMethod: 2,
            autoRecording: false,
            recordingType: 1,
            alwaysCreateNewMeeting: true
        };
        const res = await this.http.request({
            method: "POST",
            path: "/rms/meetings",
            body
        });
        const meetingId = Number(res.data?.meetingId);
        if (!Number.isFinite(meetingId) || meetingId <= 0) {
            throw new Error(ErrorMessages.RMS_MEETING_ID_INVALID);
        }
        return meetingId;
    }
    async createRecording(groupId, meetingId) {
        const body = {
            to: groupId,
            meetingId,
            recordingMethod: 2,
            recordingType: 1,
            alwaysCreateNewRecording: true
        };
        const res = await this.http.request({
            method: "POST",
            path: "/rms/meetings/recordings",
            body
        });
        const recordingId = Number(res.data?.recordingId);
        if (!Number.isFinite(recordingId) || recordingId <= 0) {
            throw new Error(ErrorMessages.RMS_RECORDING_ID_INVALID);
        }
        return recordingId;
    }
}
class Cookie {
    /** Get cookie value by name (decoded). Returns null if missing. */
    static get(name) {
        const safe = name.replace(/[-.$?*|{}()\[\]\\\/\+^]/g, "\\$&");
        const match = document.cookie.match(new RegExp(`(?:^|; )${safe}=([^;]*)`));
        return match ? decodeURIComponent(match[1]) : null;
    }
}
class Correlation {
    /** Browser-safe request id */
    static newId() {
        const c = crypto;
        if (c && typeof c.randomUUID === "function")
            return c.randomUUID();
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}
class HttpError extends Error {
    constructor(message, status, requestId, url, details) {
        super(message);
        this.status = status;
        this.requestId = requestId;
        this.url = url;
        this.details = details;
        this.name = "HttpError";
    }
}
class JoinErrorUtils {
    static parseErrorCode(errorCodeRaw) {
        const code = Number(errorCodeRaw);
        return Number.isFinite(code) ? code : null;
    }
    static extractErrorText(data) {
        return String(data?.error || data?.error_reason || data?.reason || "").trim();
    }
    static isParticipantIdCollisionError(errorCode, errorText) {
        const lower = errorText.toLowerCase();
        if (errorCode === ErrorCodes.JANUS_PARTICIPANT_ID_COLLISION)
            return true;
        return lower.includes("id") &&
            (lower.includes("exists") || lower.includes("exist") || lower.includes("already") || lower.includes("taken"));
    }
    static isUnauthorizedJoinError(errorCode, errorText) {
        const lower = errorText.toLowerCase();
        return lower.includes("unauthor") ||
            lower.includes("forbidden") ||
            errorCode === ErrorCodes.JANUS_UNAUTHORIZED ||
            errorCode === ErrorCodes.JANUS_FORBIDDEN;
    }
    static isRoomMissingError(errorText) {
        const lower = errorText.toLowerCase();
        return lower.includes("no such room") || lower.includes("room not found");
    }
}
class MediaErrorUtils {
    static getErrorName(err) {
        const anyErr = err;
        return String(anyErr?.name || anyErr?.error?.name || "").trim();
    }
    static getErrorMessage(err) {
        const anyErr = err;
        return String(anyErr?.message || anyErr?.error?.message || "").trim();
    }
    static isMediaPermissionError(err) {
        const name = this.getErrorName(err).toLowerCase();
        const msg = this.getErrorMessage(err).toLowerCase();
        return name === "notallowederror" ||
            name === "permissiondeniederror" ||
            name === "securityerror" ||
            /permission|denied|not allowed/.test(msg);
    }
    static isMediaDeviceMissingError(err) {
        const name = this.getErrorName(err).toLowerCase();
        const msg = this.getErrorMessage(err).toLowerCase();
        return name === "notfounderror" ||
            name === "devicesnotfounderror" ||
            /requested device not found|notfound/.test(msg);
    }
    static isMediaBusyError(err) {
        const name = this.getErrorName(err).toLowerCase();
        const msg = this.getErrorMessage(err).toLowerCase();
        return name === "notreadableerror" ||
            name === "trackstarterror" ||
            /device in use|device is busy|could not start video source/.test(msg);
    }
    static isMediaConstraintError(err) {
        const name = this.getErrorName(err).toLowerCase();
        const msg = this.getErrorMessage(err).toLowerCase();
        return name === "overconstrainederror" ||
            name === "constraintnotsatisfiederror" ||
            /overconstrained|constraint/.test(msg);
    }
    static getCameraMicErrorMessage(err) {
        if (this.isMediaPermissionError(err)) {
            return ErrorMessages.MEDIA_PERMISSION_BLOCKED;
        }
        if (this.isMediaDeviceMissingError(err)) {
            return ErrorMessages.MEDIA_DEVICE_MISSING;
        }
        if (this.isMediaBusyError(err)) {
            return ErrorMessages.MEDIA_DEVICE_BUSY;
        }
        if (this.isMediaConstraintError(err)) {
            return ErrorMessages.MEDIA_CONSTRAINT_UNSUPPORTED;
        }
        return ErrorMessages.MEDIA_CAMERA_MIC_GENERIC;
    }
    static getScreenShareErrorMessage(err) {
        if (this.isMediaPermissionError(err)) {
            return ErrorMessages.MEDIA_SCREEN_BLOCKED_OR_CANCELED;
        }
        if (this.getErrorName(err).toLowerCase() === "aborterror") {
            return ErrorMessages.MEDIA_SCREEN_CANCELED;
        }
        if (this.isMediaBusyError(err)) {
            return ErrorMessages.MEDIA_SCREEN_UNAVAILABLE_BUSY;
        }
        return ErrorMessages.MEDIA_SCREEN_FAILED;
    }
    static classifyPublishError(err) {
        if (this.isMediaPermissionError(err) ||
            this.isMediaDeviceMissingError(err) ||
            this.isMediaBusyError(err) ||
            this.isMediaConstraintError(err)) {
            return {
                userMessage: this.getCameraMicErrorMessage(err),
                retryable: false
            };
        }
        return {
            userMessage: ErrorMessages.CALL_OFFER_ERROR_RECOVERING,
            retryable: true
        };
    }
}
class CodecSupportUtil {
    static normalizeCodec(raw) {
        const normalized = String(raw ?? "").trim().toLowerCase();
        if (normalized === "vp8" || normalized === "vp9")
            return normalized;
        return null;
    }
    static getConfiguredVideoCodecOrder() {
        const configured = Array.isArray(APP_CONFIG.media.videoCodecPreferenceOrder)
            ? APP_CONFIG.media.videoCodecPreferenceOrder
            : ["vp9", "vp8"];
        const order = [];
        configured.forEach((codec) => {
            const normalized = this.normalizeCodec(codec);
            if (!normalized)
                return;
            if (order.includes(normalized))
                return;
            order.push(normalized);
        });
        if (order.length === 0) {
            order.push("vp9", "vp8");
        }
        else if (APP_CONFIG.media.enableVideoCodecFallback && !order.includes("vp8")) {
            order.push("vp8");
        }
        return order;
    }
    static getRoomVideoCodecList() {
        return this.getConfiguredVideoCodecOrder().join(",");
    }
    static getBrowserSupportedVideoCodecs() {
        const supported = new Set();
        try {
            const caps = typeof RTCRtpSender !== "undefined" && typeof RTCRtpSender.getCapabilities === "function"
                ? RTCRtpSender.getCapabilities("video")
                : null;
            caps?.codecs?.forEach((codec) => {
                const mimeType = String(codec?.mimeType || "").toLowerCase();
                if (mimeType.endsWith("/vp9"))
                    supported.add("vp9");
                if (mimeType.endsWith("/vp8"))
                    supported.add("vp8");
            });
        }
        catch { }
        return supported;
    }
    static getPublishCodecAttemptOrder() {
        const preferred = this.getConfiguredVideoCodecOrder();
        const supported = this.getBrowserSupportedVideoCodecs();
        if (supported.size === 0)
            return preferred;
        const allowed = preferred.filter(codec => supported.has(codec));
        return allowed.length > 0 ? allowed : preferred;
    }
}
class ParticipantRoster {
    constructor() {
        this.ids = new Set();
    }
    setSelf(id) { this.selfId = id; this.ids.add(id); }
    add(id) { this.ids.add(id); }
    remove(id) { this.ids.delete(id); }
    has(id) { return this.ids.has(id); }
    snapshot(roomId) {
        return { roomId, participantIds: Array.from(this.ids.values()), selfId: this.selfId };
    }
    reset() { this.ids.clear(); this.selfId = undefined; }
}
class MediaManager {
    constructor() {
        this.localPreviewStream = null;
        this.remotePlayPromise = null;
    }
    setLocalTrack(video, track) {
        if (!this.localPreviewStream)
            this.localPreviewStream = new MediaStream();
        this.localPreviewStream.getTracks().forEach(t => this.localPreviewStream.removeTrack(t));
        this.localPreviewStream.addTrack(track);
        video.srcObject = this.localPreviewStream;
        video.muted = true;
        video.play().catch((e) => {
            if (e?.name === "AbortError")
                return;
            Logger.error(ErrorMessages.MEDIA_LOCAL_VIDEO_PLAY_FAILED, e);
        });
    }
    setRemoteTrack(video, track) {
        const ms = video.srcObject || new MediaStream();
        // Keep one active track per kind for this single remote renderer.
        ms.getTracks().forEach(t => {
            if (t.kind === track.kind && t.id !== track.id) {
                ms.removeTrack(t);
                try {
                    t.stop();
                }
                catch (e) {
                    Logger.error(ErrorMessages.MEDIA_STOP_REPLACED_REMOTE_TRACK_FAILED, e);
                }
            }
        });
        ms.addTrack(track);
        if (video.srcObject !== ms) {
            video.srcObject = ms;
        }
        if (!video.paused)
            return;
        if (this.remotePlayPromise)
            return;
        this.remotePlayPromise = video.play()
            .catch((e) => {
            // Normal when track/srcObject is reloaded during renegotiation.
            if (e?.name === "AbortError")
                return;
            Logger.error(ErrorMessages.MEDIA_REMOTE_VIDEO_PLAY_FAILED, e);
        })
            .finally(() => {
            this.remotePlayPromise = null;
        });
    }
    removeRemoteTrack(video, track) {
        const ms = video.srcObject;
        if (!ms)
            return;
        ms.getTracks().forEach(t => {
            if (t === track || t.id === track.id) {
                ms.removeTrack(t);
            }
        });
        if (ms.getTracks().length === 0) {
            video.srcObject = null;
        }
    }
    clearLocal(video) {
        const ms = video.srcObject;
        if (ms)
            ms.getTracks().forEach(t => t.stop());
        video.srcObject = null;
        this.localPreviewStream = null;
    }
    clearRemote(video) {
        this.remotePlayPromise = null;
        const ms = video.srcObject;
        if (ms)
            ms.getTracks().forEach(t => t.stop());
        video.srcObject = null;
    }
}
class VirtualBackgroundManager {
    constructor() {
        this.bg = new Image();
        this.seg = null;
        this.running = false;
        this.segInFlight = false;
        this.srcStream = null;
        this.outStream = null;
        this.resolvedMaskMode = null;
        this.maskVotes = { normal: 0, inverted: 0 };
        this.maskProbeFrames = 0;
        this.sourceProvider = null;
        this.lastRecoverAttemptAt = 0;
        this.recoverCooldownMs = 1200;
        this.sourceReadyTimeoutMs = 2500;
        this.outputReadyTimeoutMs = 2000;
        this.hasRenderedFrame = false;
        this.bgUrl = this.getBgUrl();
        this.bg.src = this.bgUrl;
        this.canvas = document.createElement("canvas");
        const c = this.canvas.getContext("2d");
        if (!c)
            throw new Error(ErrorMessages.VB_NO_CANVAS_2D);
        this.ctx = c;
        this.srcCanvas = document.createElement("canvas");
        const sc = this.srcCanvas.getContext("2d");
        if (!sc)
            throw new Error(ErrorMessages.VB_NO_SOURCE_CANVAS_2D);
        this.srcCtx = sc;
        this.maskCanvas = document.createElement("canvas");
        const mc = this.maskCanvas.getContext("2d");
        if (!mc)
            throw new Error(ErrorMessages.VB_NO_MASK_CANVAS_2D);
        this.maskCtx = mc;
        this.bgCanvas = document.createElement("canvas");
        const bc = this.bgCanvas.getContext("2d");
        if (!bc)
            throw new Error(ErrorMessages.VB_NO_BACKGROUND_CANVAS_2D);
        this.bgCtx = bc;
        this.inVideo = document.createElement("video");
        this.inVideo.autoplay = true;
        this.inVideo.playsInline = true;
        this.inVideo.muted = true;
        this.inVideo.style.cssText = "position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;";
    }
    setSourceProvider(provider) {
        this.sourceProvider = provider;
    }
    getBgUrl() {
        try {
            return new URL("./virtual.jpeg", window.location.href).toString();
        }
        catch {
            return "./virtual.jpeg";
        }
    }
    async ensureBgLoaded() {
        const img = this.bg;
        const url = this.bgUrl;
        if (!img.src || img.src !== url) {
            img.src = url;
        }
        Logger.user(`VB background loading: ${img.src}`);
        if (img.complete && img.naturalWidth > 0) {
            Logger.user(`VB background already loaded: w=${img.naturalWidth} h=${img.naturalHeight}`);
            return;
        }
        await new Promise((resolve) => {
            img.onload = () => {
                Logger.user(`VB background loaded OK: w=${img.naturalWidth} h=${img.naturalHeight}`);
                resolve();
            };
            img.onerror = () => {
                Logger.user(`VB background FAILED to load: ${img.src}`);
                resolve();
            };
        });
    }
    cloneVideoOnlyStream(stream) {
        const inputTrack = stream.getVideoTracks()[0];
        if (!inputTrack) {
            return new MediaStream();
        }
        const clonedTrack = inputTrack.clone();
        clonedTrack.enabled = inputTrack.enabled !== false;
        return new MediaStream([clonedTrack]);
    }
    releaseSourceStream() {
        if (this.srcStream) {
            this.srcStream.getTracks().forEach((t) => {
                try {
                    t.stop();
                }
                catch { }
            });
        }
        this.srcStream = null;
        this.inVideo.srcObject = null;
    }
    async prepareSourceStream(stream) {
        const cloned = this.cloneVideoOnlyStream(stream);
        const track = cloned.getVideoTracks()[0];
        if (!track) {
            throw new Error(ErrorMessages.VB_SOURCE_TRACK_UNAVAILABLE);
        }
        this.releaseSourceStream();
        this.srcStream = cloned;
        this.inVideo.srcObject = cloned;
        if (typeof document !== "undefined" && document.body && !document.body.contains(this.inVideo)) {
            document.body.appendChild(this.inVideo);
        }
        await this.inVideo.play().catch((e) => {
            if (e?.name === "AbortError")
                return;
            Logger.error(ErrorMessages.VB_INPUT_VIDEO_PLAY_FAILED, e);
            throw e;
        });
    }
    ensureSegmentation() {
        if (this.seg)
            return;
        this.seg = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        this.seg.setOptions({ modelSelection: 1 });
        this.seg.onResults((r) => this.onResults(r));
    }
    async enable(stream) {
        this.running = false;
        this.segInFlight = false;
        this.resolvedMaskMode = null;
        this.maskVotes.normal = 0;
        this.maskVotes.inverted = 0;
        this.maskProbeFrames = 0;
        this.hasRenderedFrame = false;
        try {
            await this.prepareSourceStream(stream);
            await this.waitForInputVideoFrame(this.sourceReadyTimeoutMs);
            await this.ensureBgLoaded();
            this.ensureSegmentation();
            this.primeOutputCanvasFromInput();
            this.outStream = this.canvas.captureStream(24);
            const outTrack = this.outStream.getVideoTracks()[0];
            if (!outTrack) {
                throw new Error(ErrorMessages.CALL_VB_OUTPUT_TRACK_UNAVAILABLE);
            }
            outTrack.enabled = true;
            this.running = true;
            this.loop();
            await this.waitForRenderedOutputFrame(this.outputReadyTimeoutMs);
            Logger.user("Virtual background enabled");
            Logger.setStatus(ErrorMessages.VB_ENABLED);
            return this.outStream;
        }
        catch (e) {
            this.disable();
            throw e;
        }
    }
    disable() {
        this.running = false;
        this.segInFlight = false;
        this.outStream = null;
        this.releaseSourceStream();
        Logger.user("Virtual background disabled");
        Logger.setStatus(ErrorMessages.VB_DISABLED);
    }
    getSourceStream() { return this.srcStream; }
    getOutputStream() { return this.outStream; }
    async tryRecoverSource() {
        if (!this.sourceProvider)
            return;
        const now = Date.now();
        if (now - this.lastRecoverAttemptAt < this.recoverCooldownMs)
            return;
        this.lastRecoverAttemptAt = now;
        try {
            const next = await this.sourceProvider();
            const nextTrack = next?.getVideoTracks()[0];
            if (!next || !nextTrack || nextTrack.readyState !== "live")
                return;
            await this.prepareSourceStream(next);
            Logger.user("Virtual background source recovered");
        }
        catch (e) {
            Logger.error(ErrorMessages.VB_SOURCE_RECOVERY_FAILED, e);
        }
    }
    async loop() {
        while (this.running) {
            if (this.inVideo.readyState >= 2) {
                try {
                    if (this.inVideo.paused) {
                        await this.inVideo.play().catch(() => { });
                    }
                    const srcVideoTrack = this.srcStream?.getVideoTracks()[0] ?? null;
                    if (!srcVideoTrack || srcVideoTrack.readyState !== "live") {
                        await this.tryRecoverSource();
                    }
                    else {
                        if (!srcVideoTrack.enabled)
                            srcVideoTrack.enabled = true;
                        // Always paint raw camera first so preview never goes black.
                        const w = this.inVideo.videoWidth || 640;
                        const h = this.inVideo.videoHeight || 480;
                        this.ensureCanvasSizes(w, h);
                        this.ctx.globalCompositeOperation = "source-over";
                        this.ctx.clearRect(0, 0, w, h);
                        this.ctx.drawImage(this.inVideo, 0, 0, w, h);
                        this.hasRenderedFrame = true;
                        // Kick segmentation in non-blocking mode to avoid loop freeze.
                        if (!this.segInFlight && this.seg) {
                            this.segInFlight = true;
                            void this.seg.send({ image: this.inVideo })
                                .catch((e) => {
                                Logger.error(ErrorMessages.VB_SEGMENTATION_FRAME_FAILED, e);
                            })
                                .finally(() => {
                                this.segInFlight = false;
                            });
                        }
                    }
                }
                catch (e) {
                    Logger.error(ErrorMessages.VB_LOOP_FAILED, e);
                }
            }
            else {
                await this.tryRecoverSource();
            }
            await new Promise(r => setTimeout(r, 33));
        }
    }
    ensureCanvasSizes(w, h) {
        if (this.canvas.width !== w)
            this.canvas.width = w;
        if (this.canvas.height !== h)
            this.canvas.height = h;
        if (this.srcCanvas.width !== w)
            this.srcCanvas.width = w;
        if (this.srcCanvas.height !== h)
            this.srcCanvas.height = h;
        if (this.maskCanvas.width !== w)
            this.maskCanvas.width = w;
        if (this.maskCanvas.height !== h)
            this.maskCanvas.height = h;
        if (this.bgCanvas.width !== w)
            this.bgCanvas.width = w;
        if (this.bgCanvas.height !== h)
            this.bgCanvas.height = h;
    }
    onResults(results) {
        if (!this.running)
            return;
        if (!results?.image || !results?.segmentationMask)
            return;
        const w = (results.image && results.image.width) || this.inVideo.videoWidth || 640;
        const h = (results.image && results.image.height) || this.inVideo.videoHeight || 480;
        if (!w || !h)
            return;
        this.ensureCanvasSizes(w, h);
        // If background not available, keep raw frame already rendered by loop.
        if (!(this.bg.complete && this.bg.naturalWidth > 0)) {
            return;
        }
        try {
            this.srcCtx.clearRect(0, 0, w, h);
            this.srcCtx.drawImage(results.image, 0, 0, w, h);
            const srcData = this.srcCtx.getImageData(0, 0, w, h);
            this.maskCtx.clearRect(0, 0, w, h);
            this.maskCtx.drawImage(results.segmentationMask, 0, 0, w, h);
            const maskData = this.maskCtx.getImageData(0, 0, w, h);
            this.bgCtx.clearRect(0, 0, w, h);
            this.bgCtx.drawImage(this.bg, 0, 0, w, h);
            const bgData = this.bgCtx.getImageData(0, 0, w, h);
            const mode = this.getMaskMode(maskData, w, h);
            const out = this.ctx.createImageData(w, h);
            const src = srcData.data;
            const mask = maskData.data;
            const bg = bgData.data;
            const dst = out.data;
            for (let i = 0; i < dst.length; i += 4) {
                // Use alpha when available; otherwise fall back to luma from RGB mask.
                const alpha = mask[i + 3];
                const luma = (mask[i] + mask[i + 1] + mask[i + 2]) / 3;
                let m = alpha > 8 ? (alpha / 255) : (luma / 255);
                if (mode === "inverted")
                    m = 1 - m;
                if (m < 0)
                    m = 0;
                if (m > 1)
                    m = 1;
                const inv = 1 - m;
                dst[i] = Math.round(src[i] * m + bg[i] * inv);
                dst[i + 1] = Math.round(src[i + 1] * m + bg[i + 1] * inv);
                dst[i + 2] = Math.round(src[i + 2] * m + bg[i + 2] * inv);
                dst[i + 3] = 255;
            }
            this.ctx.putImageData(out, 0, 0);
            this.hasRenderedFrame = true;
        }
        catch (e) {
            Logger.error(ErrorMessages.VB_COMPOSITION_FAILED, e);
        }
    }
    async waitForInputVideoFrame(timeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (this.inVideo.readyState >= 2 && this.inVideo.videoWidth > 0 && this.inVideo.videoHeight > 0) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error(ErrorMessages.VB_SOURCE_TRACK_UNAVAILABLE);
    }
    primeOutputCanvasFromInput() {
        const w = this.inVideo.videoWidth || 640;
        const h = this.inVideo.videoHeight || 480;
        this.ensureCanvasSizes(w, h);
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.drawImage(this.inVideo, 0, 0, w, h);
        this.hasRenderedFrame = true;
    }
    async waitForRenderedOutputFrame(timeoutMs) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (this.hasRenderedFrame) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 33));
        }
        throw new Error(ErrorMessages.VB_OUTPUT_FRAME_TIMEOUT);
    }
    getMaskMode(maskData, w, h) {
        const configured = APP_CONFIG.virtualBackground.maskMode;
        if (configured === "normal" || configured === "inverted")
            return configured;
        if (this.resolvedMaskMode)
            return this.resolvedMaskMode;
        const centerPoints = [
            [0.5, 0.5],
            [0.45, 0.5],
            [0.55, 0.5],
            [0.5, 0.44],
            [0.5, 0.56]
        ];
        const edgePoints = [
            [0.08, 0.08],
            [0.5, 0.08],
            [0.92, 0.08],
            [0.08, 0.5],
            [0.92, 0.5],
            [0.08, 0.92],
            [0.5, 0.92],
            [0.92, 0.92]
        ];
        const center = this.sampleMaskSignal(maskData.data, centerPoints, w, h);
        const edge = this.sampleMaskSignal(maskData.data, edgePoints, w, h);
        const alphaDiff = center.alpha - edge.alpha;
        const lumaDiff = center.luma - edge.luma;
        const useAlpha = Math.abs(alphaDiff) >= Math.abs(lumaDiff);
        const diff = useAlpha ? alphaDiff : lumaDiff;
        const minDiff = APP_CONFIG.virtualBackground.maskAutoMinDiff;
        this.maskProbeFrames += 1;
        if (Math.abs(diff) >= minDiff) {
            const guess = diff >= 0 ? "normal" : "inverted";
            this.maskVotes[guess] += 1;
            if (this.maskVotes[guess] >= APP_CONFIG.virtualBackground.maskAutoConfirmFrames) {
                this.resolvedMaskMode = guess;
                Logger.user(`VB mask mode auto-selected: ${guess}`);
                return this.resolvedMaskMode;
            }
            return guess;
        }
        if (this.maskProbeFrames >= APP_CONFIG.virtualBackground.maskAutoProbeFrames) {
            this.resolvedMaskMode = this.maskVotes.inverted > this.maskVotes.normal ? "inverted" : "normal";
            Logger.user(`VB mask mode auto-fallback: ${this.resolvedMaskMode}`);
            return this.resolvedMaskMode;
        }
        return this.maskVotes.inverted > this.maskVotes.normal ? "inverted" : "normal";
    }
    sampleMaskSignal(rgba, points, w, h) {
        if (!points.length)
            return { alpha: 0, luma: 0 };
        let alphaSum = 0;
        let lumaSum = 0;
        points.forEach(([nx, ny]) => {
            const x = Math.max(0, Math.min(w - 1, Math.floor(nx * w)));
            const y = Math.max(0, Math.min(h - 1, Math.floor(ny * h)));
            const i = (y * w + x) * 4;
            const r = rgba[i];
            const g = rgba[i + 1];
            const b = rgba[i + 2];
            const a = rgba[i + 3];
            alphaSum += a;
            lumaSum += (r + g + b) / 3;
        });
        return {
            alpha: alphaSum / points.length,
            luma: lumaSum / points.length
        };
    }
}
class ScreenShareManager {
    constructor() {
        this.stream = null;
    }
    async start() {
        // Get screen share stream
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });
        // Get audio stream
        const mic = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        // combine streams
        mic.getAudioTracks().forEach(track => stream.addTrack(track));
        this.stream = stream;
        return this.stream;
    }
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    }
    getStream() {
        return this.stream;
    }
}
class NetworkQualityManager {
    constructor() {
        this.timer = null;
        this.previousBytes = new Map();
        this.sampleBusy = false;
    }
    start(cb, peersProvider) {
        this.stop();
        const sample = async () => {
            if (this.sampleBusy)
                return;
            this.sampleBusy = true;
            try {
                const peers = peersProvider?.() ?? { publisher: null, subscribers: [] };
                const hasPeers = !!peers.publisher || peers.subscribers.length > 0;
                if (hasPeers) {
                    const localMetrics = peers.publisher
                        ? await this.collectPeerMetrics("publisher", peers.publisher)
                        : null;
                    const remoteMetricsList = await Promise.all(peers.subscribers.map((pc, i) => this.collectPeerMetrics(`subscriber-${i}`, pc)));
                    const remoteMetrics = this.mergePeerMetrics(remoteMetricsList);
                    const local = localMetrics
                        ? this.calc(localMetrics.rttMs, localMetrics.jitterMs, localMetrics.lossPct, localMetrics.bitrateKbps)
                        : "Low";
                    const remote = remoteMetrics
                        ? this.calc(remoteMetrics.rttMs, remoteMetrics.jitterMs, remoteMetrics.lossPct, remoteMetrics.bitrateKbps)
                        : "Low";
                    const details = [
                        "src=webrtc-stats",
                        localMetrics
                            ? `local(rtt=${Math.round(localMetrics.rttMs)}ms jitter=${Math.round(localMetrics.jitterMs)}ms loss=${localMetrics.lossPct.toFixed(1)}% bitrate=${Math.round(localMetrics.bitrateKbps)}kbps)`
                            : "local(n/a)",
                        remoteMetrics
                            ? `remote(rtt=${Math.round(remoteMetrics.rttMs)}ms jitter=${Math.round(remoteMetrics.jitterMs)}ms loss=${remoteMetrics.lossPct.toFixed(1)}% bitrate=${Math.round(remoteMetrics.bitrateKbps)}kbps)`
                            : "remote(n/a)"
                    ].join(" ");
                    cb(local, remote, details);
                    return;
                }
                if (APP_CONFIG.networkQuality.useSimulatedFallback) {
                    const sim = this.sampleSimulatedMetrics();
                    const q = this.calc(sim.rttMs, sim.jitterMs, sim.lossPct, sim.bitrateKbps);
                    cb(q, q, `[simulated] rtt=${Math.round(sim.rttMs)}ms jitter=${Math.round(sim.jitterMs)}ms loss=${sim.lossPct.toFixed(1)}% bitrate=${Math.round(sim.bitrateKbps)}kbps`);
                    return;
                }
                cb("Low", "Low", "src=webrtc-stats unavailable");
            }
            catch (e) {
                Logger.error(ErrorMessages.NETWORK_QUALITY_STATS_SAMPLING_FAILED, e);
                cb("Low", "Low", ErrorMessages.NETWORK_QUALITY_DETAILS_ERROR);
            }
            finally {
                this.sampleBusy = false;
            }
        };
        this.timer = window.setInterval(() => {
            void sample();
        }, APP_CONFIG.networkQuality.sampleIntervalMs);
        void sample();
    }
    stop() {
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.sampleBusy = false;
        this.previousBytes.clear();
    }
    calc(rtt, jitter, loss, bitrate) {
        let score = 0;
        if (rtt < APP_CONFIG.networkQuality.thresholds.rttGoodMs)
            score++;
        if (jitter < APP_CONFIG.networkQuality.thresholds.jitterGoodMs)
            score++;
        if (loss < APP_CONFIG.networkQuality.thresholds.lossGoodPct)
            score++;
        if (bitrate > APP_CONFIG.networkQuality.thresholds.bitrateGoodKbps)
            score++;
        if (score >= 4)
            return "High";
        if (score >= 2)
            return "Medium";
        return "Low";
    }
    async collectPeerMetrics(key, pc) {
        const report = await pc.getStats();
        let rttMs = 0;
        let jitterMs = 0;
        let packetsTotal = 0;
        let packetsLost = 0;
        let bytesTotal = 0;
        report.forEach((s) => {
            const anyS = s;
            if (s.type === "candidate-pair" && (anyS.selected || anyS.nominated) && typeof anyS.currentRoundTripTime === "number") {
                rttMs = Math.max(rttMs, anyS.currentRoundTripTime * 1000);
            }
            const isMediaRtp = anyS.kind === "video" || anyS.mediaType === "video" || anyS.kind === "audio" || anyS.mediaType === "audio";
            if (s.type === "remote-inbound-rtp" && isMediaRtp && typeof anyS.roundTripTime === "number") {
                rttMs = Math.max(rttMs, anyS.roundTripTime * 1000);
            }
            if ((s.type === "inbound-rtp" || s.type === "outbound-rtp" || s.type === "remote-inbound-rtp") && isMediaRtp) {
                if (typeof anyS.jitter === "number") {
                    jitterMs = Math.max(jitterMs, anyS.jitter * 1000);
                }
                const recv = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
                const lost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
                packetsTotal += recv + lost;
                packetsLost += lost;
                const bytesReceived = typeof anyS.bytesReceived === "number" ? anyS.bytesReceived : 0;
                const bytesSent = typeof anyS.bytesSent === "number" ? anyS.bytesSent : 0;
                bytesTotal += bytesReceived + bytesSent;
            }
        });
        const lossPct = packetsTotal > 0 ? (packetsLost / packetsTotal) * 100 : 0;
        const bitrateKbps = this.computeBitrateKbps(key, bytesTotal);
        return { rttMs, jitterMs, lossPct, bitrateKbps };
    }
    mergePeerMetrics(metrics) {
        if (metrics.length === 0)
            return null;
        const totals = metrics.reduce((acc, m) => {
            acc.rttMs += m.rttMs;
            acc.jitterMs += m.jitterMs;
            acc.lossPct += m.lossPct;
            acc.bitrateKbps += m.bitrateKbps;
            return acc;
        }, { rttMs: 0, jitterMs: 0, lossPct: 0, bitrateKbps: 0 });
        const n = metrics.length;
        return {
            rttMs: totals.rttMs / n,
            jitterMs: totals.jitterMs / n,
            lossPct: totals.lossPct / n,
            bitrateKbps: totals.bitrateKbps / n
        };
    }
    computeBitrateKbps(key, bytes) {
        const now = Date.now();
        const prev = this.previousBytes.get(key);
        this.previousBytes.set(key, { bytes, at: now });
        if (!prev || now <= prev.at)
            return 0;
        const deltaBytes = Math.max(0, bytes - prev.bytes);
        const seconds = (now - prev.at) / 1000;
        if (seconds <= 0)
            return 0;
        return (deltaBytes * 8) / 1000 / seconds;
    }
    sampleSimulatedMetrics() {
        return {
            rttMs: APP_CONFIG.networkQuality.simulated.rttBaseMs + Math.random() * APP_CONFIG.networkQuality.simulated.rttSpreadMs,
            jitterMs: APP_CONFIG.networkQuality.simulated.jitterBaseMs + Math.random() * APP_CONFIG.networkQuality.simulated.jitterSpreadMs,
            lossPct: Math.random() * APP_CONFIG.networkQuality.simulated.lossMaxPct,
            bitrateKbps: APP_CONFIG.networkQuality.simulated.bitrateBaseKbps + Math.random() * APP_CONFIG.networkQuality.simulated.bitrateSpreadKbps
        };
    }
}
class ParticipantNetworkStatsManager {
    constructor() {
        this.timer = null;
        this.sampleBusy = false;
        this.previousCounters = new Map();
        this.slowLinks = new Map();
        this.remoteTelemetryByFeed = new Map();
    }
    start(cb, peersProvider) {
        this.stop();
        const sample = async () => {
            if (this.sampleBusy)
                return;
            this.sampleBusy = true;
            try {
                const snapshot = await this.buildSnapshot(peersProvider());
                cb(snapshot);
            }
            catch (e) {
                Logger.error("participant network sampling failed", e);
            }
            finally {
                this.sampleBusy = false;
            }
        };
        this.timer = window.setInterval(() => {
            void sample();
        }, APP_CONFIG.networkQuality.participantPanel.sampleIntervalMs);
        void sample();
    }
    stop() {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        this.sampleBusy = false;
        this.previousCounters.clear();
        this.slowLinks.clear();
        this.remoteTelemetryByFeed.clear();
    }
    recordSlowLink(signal) {
        const key = signal.source === "publisher"
            ? "self"
            : `feed:${signal.feedId ?? signal.participantId ?? -1}`;
        const prev = this.slowLinks.get(key) ?? { uplinkAt: 0, downlinkAt: 0 };
        if (signal.direction === "uplink") {
            prev.uplinkAt = signal.at || Date.now();
        }
        else {
            prev.downlinkAt = signal.at || Date.now();
        }
        this.slowLinks.set(key, prev);
    }
    recordRemoteNetworkTelemetry(feedId, payload) {
        if (!Number.isFinite(feedId))
            return;
        this.remoteTelemetryByFeed.set(feedId, payload);
    }
    async buildSnapshot(peers) {
        const remoteCount = peers.subscribers.length;
        const localRates = peers.publisher
            ? await this.collectPeerRates("publisher", peers.publisher)
            : { sentKbps: null, receivedKbps: null, rttMs: null, jitterMs: null, lossPct: null };
        const remoteRates = await Promise.all(peers.subscribers.map(async (sub) => {
            const rates = await this.collectPeerRates(`subscriber-${sub.feedId}`, sub.pc);
            const remoteTelemetry = this.getFreshRemoteTelemetry(sub.feedId);
            return { feedId: sub.feedId, rates, remoteTelemetry };
        }));
        const remoteUploadsKnown = remoteRates
            .map((entry) => entry.remoteTelemetry?.uploadKbps ?? entry.rates.receivedKbps)
            .filter((v) => v !== null && Number.isFinite(v));
        const remoteDownloadsKnown = remoteRates
            .map((entry) => entry.remoteTelemetry?.downloadKbps ?? null)
            .filter((v) => v !== null && Number.isFinite(v));
        const remoteJitterKnown = remoteRates
            .map((entry) => entry.remoteTelemetry?.jitterMs ?? entry.rates.jitterMs)
            .filter((v) => v !== null && Number.isFinite(v));
        const remoteLossKnown = remoteRates
            .map((entry) => entry.remoteTelemetry?.lossPct ?? entry.rates.lossPct)
            .filter((v) => v !== null && Number.isFinite(v));
        const remoteRttKnown = remoteRates
            .map((entry) => entry.rates.rttMs)
            .filter((v) => v !== null && Number.isFinite(v));
        const localDownloadKbps = remoteCount === 0
            ? 0
            : (remoteUploadsKnown.length > 0
                ? remoteUploadsKnown.reduce((sum, v) => sum + v, 0)
                : null);
        const aggregateRemoteJitterMs = remoteCount === 0 ? null : this.averageKnown(remoteJitterKnown);
        const aggregateRemoteLossPct = remoteCount === 0 ? null : this.averageKnown(remoteLossKnown);
        const aggregateRemoteRttMs = remoteCount === 0 ? null : this.averageKnown(remoteRttKnown);
        const localUploadKbps = localRates.sentKbps;
        const remoteDownloadSumKbps = remoteCount === 0
            ? 0
            : (remoteDownloadsKnown.length > 0
                ? remoteDownloadsKnown.reduce((sum, v) => sum + v, 0)
                : localUploadKbps);
        const perRemoteDownloadKbps = remoteCount > 0 && localUploadKbps !== null
            ? localUploadKbps / remoteCount
            : null;
        const localUploadDirection = this.createDirection(localUploadKbps, this.isSlowLinkActive("self", "uplink"));
        const localDownloadDirection = this.createDirection(localDownloadKbps, this.isSlowLinkActive("self", "downlink"));
        const aggregateRemoteUploadDirection = this.createDirection(remoteCount === 0 ? 0 : localDownloadKbps, remoteCount > 0 && remoteRates.some((entry) => this.isSlowLinkActive(`feed:${entry.feedId}`, "uplink")));
        const aggregateRemoteDownloadDirection = this.createDirection(remoteCount === 0 ? 0 : remoteDownloadSumKbps, remoteCount > 0 && remoteRates.some((entry) => this.isSlowLinkActive(`feed:${entry.feedId}`, "downlink")));
        const rows = [];
        const selfLabel = peers.selfId !== null ? `You (${peers.selfId})` : "You";
        rows.push({
            participantId: peers.selfId,
            label: selfLabel,
            upload: localUploadDirection,
            download: localDownloadDirection,
            remoteUpload: aggregateRemoteUploadDirection,
            remoteDownload: aggregateRemoteDownloadDirection,
            quality: {
                localRttMs: localRates.rttMs,
                localJitterMs: localRates.jitterMs,
                localLossPct: localRates.lossPct,
                remoteRttMs: aggregateRemoteRttMs,
                remoteJitterMs: aggregateRemoteJitterMs,
                remoteLossPct: aggregateRemoteLossPct
            },
            likelyBottleneck: this.classifyBottleneck(localUploadDirection, localDownloadDirection, aggregateRemoteUploadDirection, aggregateRemoteDownloadDirection)
        });
        remoteRates.forEach(({ feedId, rates, remoteTelemetry }) => {
            const key = `feed:${feedId}`;
            const remoteUploadDirection = this.createDirection(remoteTelemetry?.uploadKbps ?? rates.receivedKbps, this.isSlowLinkActive(key, "uplink"));
            const remoteDownloadDirection = this.createDirection(remoteTelemetry?.downloadKbps ?? perRemoteDownloadKbps, this.isSlowLinkActive(key, "downlink"));
            rows.push({
                participantId: feedId,
                label: `Participant ${feedId}`,
                upload: remoteUploadDirection,
                download: remoteDownloadDirection,
                remoteUpload: localUploadDirection,
                remoteDownload: localDownloadDirection,
                quality: {
                    localRttMs: localRates.rttMs,
                    localJitterMs: localRates.jitterMs,
                    localLossPct: localRates.lossPct,
                    remoteRttMs: rates.rttMs,
                    remoteJitterMs: remoteTelemetry?.jitterMs ?? rates.jitterMs,
                    remoteLossPct: remoteTelemetry?.lossPct ?? rates.lossPct
                },
                likelyBottleneck: this.classifyBottleneck(localUploadDirection, localDownloadDirection, remoteUploadDirection, remoteDownloadDirection)
            });
        });
        return {
            rows,
            updatedAt: Date.now()
        };
    }
    createDirection(kbps, forceLowBySlowLink) {
        const normalized = kbps !== null && Number.isFinite(kbps) ? Math.max(0, kbps) : null;
        return {
            kbps: normalized,
            tier: this.classifyTier(normalized),
            slowLink: forceLowBySlowLink
        };
    }
    classifyTier(kbps) {
        if (kbps === null || !Number.isFinite(kbps))
            return "Pending";
        const lowMax = APP_CONFIG.networkQuality.participantPanel.thresholdsKbps.lowMax;
        const mediumMax = APP_CONFIG.networkQuality.participantPanel.thresholdsKbps.mediumMax;
        if (kbps <= lowMax)
            return "Low";
        if (kbps <= mediumMax)
            return "Medium";
        return "Good";
    }
    getFreshRemoteTelemetry(feedId) {
        const payload = this.remoteTelemetryByFeed.get(feedId) ?? null;
        if (!payload)
            return null;
        if (Date.now() - payload.ts > APP_CONFIG.mediaTelemetry.peerTelemetryFreshnessMs)
            return null;
        return payload;
    }
    classifyBottleneck(localUpload, localDownload, remoteUpload, remoteDownload) {
        const localSlow = localUpload.slowLink || localDownload.slowLink;
        const remoteSlow = remoteUpload.slowLink || remoteDownload.slowLink;
        if (localSlow && remoteSlow)
            return "Both";
        if (localSlow)
            return "You";
        if (remoteSlow)
            return "Remote";
        const localUplinkBad = localUpload.tier === "Low";
        const localDownlinkBad = localDownload.tier === "Low";
        const remoteUplinkBad = remoteUpload.tier === "Low";
        const remoteDownlinkBad = remoteDownload.tier === "Low";
        const uploadPathBad = localUplinkBad && remoteDownlinkBad;
        const downloadPathBad = remoteUplinkBad && localDownlinkBad;
        if (uploadPathBad && downloadPathBad)
            return "Both";
        if (uploadPathBad)
            return "You";
        if (downloadPathBad)
            return "Remote";
        if ((localUplinkBad || localDownlinkBad) && !(remoteUplinkBad || remoteDownlinkBad))
            return "You";
        if ((remoteUplinkBad || remoteDownlinkBad) && !(localUplinkBad || localDownlinkBad))
            return "Remote";
        return "Unknown";
    }
    averageKnown(values) {
        if (!values || values.length === 0)
            return null;
        const sum = values.reduce((acc, value) => acc + value, 0);
        return sum / values.length;
    }
    isSlowLinkActive(key, direction) {
        const entry = this.slowLinks.get(key);
        if (!entry)
            return false;
        const at = direction === "uplink" ? entry.uplinkAt : entry.downlinkAt;
        if (!at)
            return false;
        return Date.now() - at <= APP_CONFIG.networkQuality.participantPanel.slowLinkHoldMs;
    }
    async collectPeerRates(key, pc) {
        const report = await pc.getStats();
        let sentBytes = 0;
        let receivedBytes = 0;
        let rttMs = null;
        let jitterMs = null;
        let lost = 0;
        let total = 0;
        report.forEach((s) => {
            const anyS = s;
            const kind = anyS.kind || anyS.mediaType;
            if (s.type === "candidate-pair" && (anyS.selected || anyS.nominated) && typeof anyS.currentRoundTripTime === "number") {
                const nextRtt = anyS.currentRoundTripTime * 1000;
                rttMs = rttMs === null ? nextRtt : Math.max(rttMs, nextRtt);
            }
            if (s.type === "remote-inbound-rtp" && typeof anyS.roundTripTime === "number") {
                const nextRtt = anyS.roundTripTime * 1000;
                rttMs = rttMs === null ? nextRtt : Math.max(rttMs, nextRtt);
            }
            if (kind !== "audio" && kind !== "video")
                return;
            if (s.type === "outbound-rtp" || s.type === "inbound-rtp") {
                if (typeof anyS.bytesSent === "number")
                    sentBytes += anyS.bytesSent;
                if (typeof anyS.bytesReceived === "number")
                    receivedBytes += anyS.bytesReceived;
            }
            if (s.type === "inbound-rtp" || s.type === "remote-inbound-rtp") {
                if (typeof anyS.jitter === "number") {
                    const nextJitterMs = anyS.jitter * 1000;
                    jitterMs = jitterMs === null ? nextJitterMs : Math.max(jitterMs, nextJitterMs);
                }
                const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
                const packetsReceivedOrSent = typeof anyS.packetsReceived === "number"
                    ? anyS.packetsReceived
                    : (typeof anyS.packetsSent === "number" ? anyS.packetsSent : 0);
                if (packetsLost > 0 || packetsReceivedOrSent > 0) {
                    lost += packetsLost;
                    total += packetsLost + packetsReceivedOrSent;
                }
            }
        });
        return this.computeRatesKbps(key, sentBytes, receivedBytes, rttMs, jitterMs, total > 0 ? (lost / total) * 100 : null);
    }
    computeRatesKbps(key, sentBytes, receivedBytes, rttMs, jitterMs, lossPct) {
        const now = Date.now();
        const prev = this.previousCounters.get(key);
        this.previousCounters.set(key, { sentBytes, receivedBytes, at: now });
        if (!prev || now <= prev.at) {
            return {
                sentKbps: null,
                receivedKbps: null,
                rttMs,
                jitterMs,
                lossPct
            };
        }
        const seconds = (now - prev.at) / 1000;
        if (seconds <= 0) {
            return {
                sentKbps: null,
                receivedKbps: null,
                rttMs,
                jitterMs,
                lossPct
            };
        }
        const sentDelta = Math.max(0, sentBytes - prev.sentBytes);
        const receivedDelta = Math.max(0, receivedBytes - prev.receivedBytes);
        return {
            sentKbps: (sentDelta * 8) / 1000 / seconds,
            receivedKbps: (receivedDelta * 8) / 1000 / seconds,
            rttMs,
            jitterMs,
            lossPct
        };
    }
}
class AdaptiveNetworkManager {
    constructor(userType, callbacks) {
        this.userType = userType;
        this.callbacks = callbacks;
        this.mode = "normal";
        this.timer = null;
        this.prevUpload = { bytes: 0, at: 0 };
        this.lowSamples = 0;
        this.recoverSamples = 0;
        this.likelyDisconnectSamples = 0;
        this.applyBusy = false;
        this.defaultProfile = this.getFallbackProfile();
    }
    resetForJoin(payload) {
        this.stop();
        this.mode = "normal";
        this.defaultProfile = this.resolveDefaultProfile(payload ?? null);
        this.emitRisk(null, false, "");
    }
    start(pc) {
        this.stop();
        if (!APP_CONFIG.adaptiveVideo.enabled || !pc)
            return;
        const intervalMs = Math.max(1000, APP_CONFIG.adaptiveVideo.sampleIntervalMs);
        this.timer = window.setInterval(() => {
            void this.sample(pc);
        }, intervalMs);
    }
    stop() {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        this.prevUpload = { bytes: 0, at: 0 };
        this.lowSamples = 0;
        this.recoverSamples = 0;
        this.likelyDisconnectSamples = 0;
        this.applyBusy = false;
    }
    getParticipantSyncIntervalMs() {
        if (!APP_CONFIG.adaptiveVideo.enabled)
            return APP_CONFIG.call.participantSyncIntervalMs;
        return this.mode === "low"
            ? APP_CONFIG.adaptiveVideo.wsProtection.participantSyncIntervalMsLow
            : APP_CONFIG.adaptiveVideo.wsProtection.participantSyncIntervalMsNormal;
    }
    getVideoConfig() {
        const profile = this.getActiveProfile();
        const bitrateBps = Number.isFinite(profile.bitrateBps) ? Math.floor(profile.bitrateBps) : APP_CONFIG.media.bitrateBps;
        const maxFramerate = Number.isFinite(profile.maxFramerate) ? Math.floor(profile.maxFramerate) : APP_CONFIG.media.maxFramerate;
        return {
            bitrate_bps: Math.max(APP_CONFIG.media.minBitrateBps, Math.min(APP_CONFIG.media.maxBitrateBps, bitrateBps)),
            bitrate_cap: Boolean(APP_CONFIG.media.bitrateCap),
            max_framerate: Math.max(APP_CONFIG.media.minFramerate, Math.min(APP_CONFIG.media.maxFramerateCap, maxFramerate))
        };
    }
    getCameraProfileKey() {
        const profile = this.getActiveProfile();
        return `${this.userType}:${this.mode}:${profile.width}x${profile.height}@${profile.maxFramerate}`;
    }
    buildCameraConstraints(orientation, isIOS) {
        const profile = this.getActiveProfile();
        let width = profile.width;
        let height = profile.height;
        if (isIOS) {
            if (orientation === "portrait" && width > height) {
                [width, height] = [height, width];
            }
            else if (orientation === "landscape" && height > width) {
                [width, height] = [height, width];
            }
        }
        return {
            facingMode: "user",
            width: { ideal: width, max: width },
            height: { ideal: height, max: height },
            frameRate: { ideal: profile.maxFramerate, max: profile.maxFramerate }
        };
    }
    getActiveProfile() {
        if (!APP_CONFIG.adaptiveVideo.enabled || this.mode === "normal") {
            return this.defaultProfile;
        }
        const low = APP_CONFIG.adaptiveVideo.profiles[this.userType].low;
        if (this.userType === "agent") {
            return {
                width: low.width,
                height: low.height,
                maxFramerate: low.maxFramerate,
                bitrateBps: low.bitrateBps
            };
        }
        return {
            width: this.defaultProfile.width,
            height: this.defaultProfile.height,
            maxFramerate: low.maxFramerate,
            bitrateBps: low.bitrateBps
        };
    }
    async sample(pc) {
        if (!APP_CONFIG.adaptiveVideo.enabled)
            return;
        const uploadKbps = await this.getUploadKbps(pc);
        if (uploadKbps === null) {
            this.emitRisk(null, false, "Pending");
            return;
        }
        const cfg = APP_CONFIG.adaptiveVideo;
        if (uploadKbps <= cfg.likelyDisconnectKbps) {
            this.likelyDisconnectSamples += 1;
        }
        else {
            this.likelyDisconnectSamples = 0;
        }
        let nextMode = this.mode;
        if (this.mode === "normal") {
            if (uploadKbps <= cfg.lowEnterKbps) {
                this.lowSamples += 1;
            }
            else {
                this.lowSamples = 0;
            }
            this.recoverSamples = 0;
            if (this.lowSamples >= cfg.lowEnterSamples) {
                nextMode = "low";
            }
        }
        else {
            if (uploadKbps >= cfg.lowExitKbps) {
                this.recoverSamples += 1;
            }
            else {
                this.recoverSamples = 0;
            }
            if (this.recoverSamples >= cfg.lowExitSamples) {
                nextMode = "normal";
            }
        }
        if (nextMode !== this.mode) {
            await this.applyMode(nextMode);
        }
        const likelyDisconnect = this.likelyDisconnectSamples >= cfg.likelyDisconnectSamples;
        const modeMessage = this.mode === "low" ? "Low bandwidth mode active" : "Network normal";
        this.emitRisk(uploadKbps, likelyDisconnect, likelyDisconnect ? "Likely disconnect due to very low upload" : modeMessage);
    }
    async applyMode(nextMode) {
        if (nextMode === this.mode || this.applyBusy)
            return;
        this.applyBusy = true;
        try {
            this.mode = nextMode;
            this.lowSamples = 0;
            this.recoverSamples = 0;
            await this.callbacks.onModeChanged(this.mode, this.getVideoConfig());
        }
        finally {
            this.applyBusy = false;
        }
    }
    emitRisk(uploadKbps, likelyDisconnect, message) {
        this.callbacks.onRiskSignal({
            mode: this.mode,
            uploadKbps,
            likelyDisconnect,
            message
        });
    }
    async getUploadKbps(pc) {
        try {
            const report = await pc.getStats();
            let bytesTotal = 0;
            let found = false;
            report.forEach((s) => {
                if (s.type !== "outbound-rtp" || s.isRemote)
                    return;
                const kind = s.kind || s.mediaType;
                if (kind !== "video")
                    return;
                const bytes = Number(s.bytesSent);
                if (!Number.isFinite(bytes))
                    return;
                bytesTotal += bytes;
                found = true;
            });
            if (!found) {
                report.forEach((s) => {
                    if (s.type !== "outbound-rtp" || s.isRemote)
                        return;
                    const bytes = Number(s.bytesSent);
                    if (!Number.isFinite(bytes))
                        return;
                    bytesTotal += bytes;
                    found = true;
                });
            }
            if (!found)
                return null;
            const now = Date.now();
            if (this.prevUpload.at <= 0 || bytesTotal < this.prevUpload.bytes) {
                this.prevUpload = { bytes: bytesTotal, at: now };
                return null;
            }
            const deltaBytes = bytesTotal - this.prevUpload.bytes;
            const deltaMs = now - this.prevUpload.at;
            this.prevUpload = { bytes: bytesTotal, at: now };
            if (deltaMs <= 0)
                return null;
            return (deltaBytes * 8) / deltaMs;
        }
        catch {
            return null;
        }
    }
    resolveDefaultProfile(payload) {
        const fallback = this.getFallbackProfile();
        if (!payload)
            return fallback;
        const isMobile = this.isMobileDevice();
        const picked = pickMediaConstraints(payload, isMobile);
        const pickedVideo = picked?.video;
        const chimeRole = this.userType === "agent" ? "employee" : "customer";
        const chimeNode = payload.chimeMediaConstraints?.[chimeRole]?.[isMobile ? "mobile" : "desktop"] ?? null;
        const width = this.readNumericConstraint(pickedVideo?.width) ??
            this.readNumericConstraint(chimeNode?.width) ??
            fallback.width;
        const height = this.readNumericConstraint(pickedVideo?.height) ??
            this.readNumericConstraint(chimeNode?.height) ??
            fallback.height;
        const maxFramerate = this.readNumericConstraint(pickedVideo?.frameRate) ??
            this.readNumericConstraint(chimeNode?.frameRate) ??
            fallback.maxFramerate;
        const bitrateBps = this.readNumericConstraint(payload?.videochat?.videoBandwidth) ?? fallback.bitrateBps;
        return {
            width: Math.max(1, Math.floor(width)),
            height: Math.max(1, Math.floor(height)),
            maxFramerate: Math.max(APP_CONFIG.media.minFramerate, Math.floor(maxFramerate)),
            bitrateBps: Math.max(APP_CONFIG.media.minBitrateBps, Math.floor(bitrateBps))
        };
    }
    getFallbackProfile() {
        const normal = APP_CONFIG.adaptiveVideo.profiles[this.userType].normal;
        return {
            width: Math.max(1, Math.floor(normal.width)),
            height: Math.max(1, Math.floor(normal.height)),
            maxFramerate: Math.max(APP_CONFIG.media.minFramerate, Math.floor(APP_CONFIG.media.maxFramerate)),
            bitrateBps: Math.max(APP_CONFIG.media.minBitrateBps, Math.floor(APP_CONFIG.media.bitrateBps))
        };
    }
    readNumericConstraint(value) {
        if (typeof value === "number" && Number.isFinite(value))
            return value;
        if (typeof value !== "object" || !value)
            return null;
        const keys = ["exact", "ideal", "max", "min"];
        for (const key of keys) {
            const candidate = value[key];
            if (typeof candidate === "number" && Number.isFinite(candidate)) {
                return candidate;
            }
        }
        return null;
    }
    isMobileDevice() {
        const ua = navigator.userAgent || "";
        const mobileUa = /Android|iPhone|iPad|iPod/i.test(ua);
        const iPadDesktopUa = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
        return mobileUa || iPadDesktopUa;
    }
}
class ConnectionStatusEngine {
    constructor(onUpdate) {
        this.onUpdate = onUpdate;
        this.status = {
            owner: "SYSTEM",
            primaryText: "",
            secondaryText: "",
            severity: "info",
            state: "INIT"
        };
        this.joinedAt = null;
        this.joinStartedAt = null;
        this.remoteParticipantCount = 0;
        this.remoteParticipantSeenAt = null;
        this.remoteTrackSeenAt = null;
        this.remoteMediaFlowAt = null;
        this.checkingSince = null;
        this.localPoorSince = null;
        this.relayDetectedAt = null;
        this.candidateSwitchAt = null;
        this.disconnectedSince = null;
        this.remoteNegotiationReady = false;
        this.selectedPairId = null;
        this.remoteVideoTracksByFeed = new Map();
        this.localVideoTrackIds = new Set();
        this.publisherPc = null;
        this.subscriberPcs = new Map();
        this.subscriberBytes = new Map();
        this.subscriberIceStates = new Map();
        this.subscriberConnStates = new Map();
        this.localIceState = "new";
        this.localConnState = "new";
        this.localSignalingState = "stable";
        this.rotationCursor = 0;
        this.nextRotationAt = 0;
        this.tickTimer = null;
        this.statsBusy = false;
        this.lastStatsSampleAt = 0;
        this.lastPublishedKey = "";
        this.boundPcs = new WeakSet();
        this.serverRetryAttempt = 0;
        this.serverRetryMax = 0;
        this.peerRetryAttempt = 0;
        this.peerRetryMax = 0;
        this.lastStatsErrorLogAt = 0;
        this.fatalError = null;
        this.serverRetryReason = "";
        this.peerRetryReason = "";
        this.failedReason = "";
        this.transition("INIT", true);
        this.tickTimer = window.setInterval(() => this.tick(), APP_CONFIG.connectionStatus.tickIntervalMs);
    }
    getStatus() {
        return this.status;
    }
    destroy() {
        if (this.tickTimer !== null) {
            window.clearInterval(this.tickTimer);
            this.tickTimer = null;
        }
    }
    onJoinStarted() {
        this.joinStartedAt = Date.now();
        this.joinedAt = null;
        this.remoteParticipantCount = 0;
        this.remoteParticipantSeenAt = null;
        this.remoteTrackSeenAt = null;
        this.remoteMediaFlowAt = null;
        this.checkingSince = null;
        this.localPoorSince = null;
        this.relayDetectedAt = null;
        this.candidateSwitchAt = null;
        this.disconnectedSince = null;
        this.remoteNegotiationReady = false;
        this.selectedPairId = null;
        this.subscriberPcs.clear();
        this.subscriberBytes.clear();
        this.subscriberIceStates.clear();
        this.subscriberConnStates.clear();
        this.remoteVideoTracksByFeed.clear();
        this.localVideoTrackIds.clear();
        this.serverRetryAttempt = 0;
        this.serverRetryMax = 0;
        this.peerRetryAttempt = 0;
        this.peerRetryMax = 0;
        this.serverRetryReason = "";
        this.peerRetryReason = "";
        this.failedReason = "";
        this.publisherPc = null;
        this.localIceState = "new";
        this.localConnState = "new";
        this.localSignalingState = "stable";
        this.fatalError = null;
        this.transition("MEDIA_PREP", true);
    }
    onSessionReady() {
        this.transition("NEGOTIATING", true);
    }
    onPublisherAttached() {
        this.transition("NEGOTIATING", true);
    }
    onJoinedRoom() {
        this.joinedAt = Date.now();
        this.transition("NEGOTIATING", true);
    }
    onReconnect() {
        this.transition("RETRYING", true);
    }
    onServerRetrying(attempt, maxAttempts, reason) {
        this.serverRetryAttempt = Math.max(0, attempt);
        this.serverRetryMax = Math.max(0, maxAttempts);
        this.serverRetryReason = this.formatFailureReason(reason);
        this.failedReason = "";
        this.transition("SERVER_RETRYING", true);
    }
    onPeerRetrying(attempt, maxAttempts, reason) {
        this.peerRetryAttempt = Math.max(0, attempt);
        this.peerRetryMax = Math.max(0, maxAttempts);
        this.peerRetryReason = this.formatFailureReason(reason);
        this.failedReason = "";
        this.transition("PEER_RETRYING", true);
    }
    onFailed(reason) {
        this.failedReason = this.formatFailureReason(reason);
        this.transition("FAILED", true);
    }
    onLeft() {
        this.fatalError = null;
        this.joinStartedAt = null;
        this.joinedAt = null;
        this.remoteParticipantCount = 0;
        this.remoteParticipantSeenAt = null;
        this.remoteTrackSeenAt = null;
        this.remoteMediaFlowAt = null;
        this.checkingSince = null;
        this.localPoorSince = null;
        this.relayDetectedAt = null;
        this.candidateSwitchAt = null;
        this.disconnectedSince = null;
        this.remoteNegotiationReady = false;
        this.selectedPairId = null;
        this.publisherPc = null;
        this.subscriberPcs.clear();
        this.subscriberBytes.clear();
        this.subscriberIceStates.clear();
        this.subscriberConnStates.clear();
        this.remoteVideoTracksByFeed.clear();
        this.localVideoTrackIds.clear();
        this.localIceState = "new";
        this.localConnState = "new";
        this.localSignalingState = "stable";
        this.serverRetryAttempt = 0;
        this.serverRetryMax = 0;
        this.peerRetryAttempt = 0;
        this.peerRetryMax = 0;
        this.serverRetryReason = "";
        this.peerRetryReason = "";
        this.failedReason = "";
        this.transition("INIT", true);
    }
    setFatalError(primary, secondary = "") {
        this.fatalError = { primary, secondary };
        this.publishFatalError();
    }
    setRemoteParticipantCount(count) {
        const now = Date.now();
        this.remoteParticipantCount = Math.max(0, count);
        if (this.remoteParticipantCount > 0 && this.remoteParticipantSeenAt === null) {
            this.remoteParticipantSeenAt = now;
        }
        if (this.remoteParticipantCount === 0) {
            this.remoteParticipantSeenAt = null;
            this.remoteTrackSeenAt = null;
            this.remoteMediaFlowAt = null;
            this.remoteNegotiationReady = false;
            this.subscriberPcs.clear();
            this.subscriberBytes.clear();
            this.subscriberIceStates.clear();
            this.subscriberConnStates.clear();
            this.remoteVideoTracksByFeed.clear();
        }
        this.evaluate();
    }
    registerPublisherPc(pc) {
        this.publisherPc = pc;
        this.bindPcEvents(pc, "publisher");
        this.evaluate();
    }
    registerSubscriberPc(feedId, pc) {
        this.subscriberPcs.set(feedId, pc);
        this.remoteNegotiationReady = true;
        this.bindPcEvents(pc, "subscriber", feedId);
        this.evaluate();
    }
    onSubscriberRequested() {
        this.remoteNegotiationReady = true;
        this.evaluate();
    }
    onRemoteFeedRetryExhausted(feedId, attempts) {
        Logger.warn(`[connection-status] remote feed retry exhausted feedId=${feedId} attempts=${attempts}`);
        this.transition("DEGRADED", true);
    }
    unregisterSubscriber(feedId) {
        this.subscriberPcs.delete(feedId);
        this.subscriberBytes.delete(feedId);
        this.subscriberIceStates.delete(feedId);
        this.subscriberConnStates.delete(feedId);
        this.remoteVideoTracksByFeed.delete(feedId);
        if (!this.hasLiveRemoteVideoTrack()) {
            this.remoteMediaFlowAt = null;
        }
        this.evaluate();
    }
    onRemoteTrackSignal(feedId, track, on) {
        if (track.kind !== "video")
            return;
        let tracks = this.remoteVideoTracksByFeed.get(feedId);
        if (!tracks) {
            tracks = new Set();
            this.remoteVideoTracksByFeed.set(feedId, tracks);
        }
        if (on) {
            const now = Date.now();
            this.remoteTrackSeenAt = now;
            this.remoteNegotiationReady = true;
            tracks.add(track.id);
            if (!this.subscriberBytes.has(feedId)) {
                this.subscriberBytes.set(feedId, { bytes: 0, growthAt: now });
            }
        }
        else {
            tracks.delete(track.id);
            if (tracks.size === 0) {
                this.remoteVideoTracksByFeed.delete(feedId);
            }
            if (!this.hasLiveRemoteVideoTrack()) {
                this.remoteMediaFlowAt = null;
            }
        }
        this.evaluate();
    }
    onLocalTrackSignal(track, on) {
        if (track.kind !== "video")
            return;
        if (on) {
            this.localVideoTrackIds.add(track.id);
        }
        else {
            this.localVideoTrackIds.delete(track.id);
        }
        this.evaluate();
    }
    hasLiveRemoteVideoTrack() {
        for (const tracks of this.remoteVideoTracksByFeed.values()) {
            if (tracks.size > 0)
                return true;
        }
        return false;
    }
    onSessionDestroyed() {
        this.transition("RETRYING", true);
    }
    bindPcEvents(pc, role, feedId) {
        if (this.boundPcs.has(pc))
            return;
        this.boundPcs.add(pc);
        pc.addEventListener("iceconnectionstatechange", () => {
            if (role === "publisher" && this.publisherPc === pc) {
                this.localIceState = pc.iceConnectionState;
                if (pc.iceConnectionState === "checking") {
                    if (this.checkingSince === null)
                        this.checkingSince = Date.now();
                }
                else {
                    this.checkingSince = null;
                }
            }
            if (role === "subscriber" && typeof feedId === "number") {
                this.subscriberIceStates.set(feedId, pc.iceConnectionState);
            }
            this.evaluate();
        });
        pc.addEventListener("connectionstatechange", () => {
            if (role === "publisher" && this.publisherPc === pc) {
                this.localConnState = (pc.connectionState || "new");
            }
            if (role === "subscriber" && typeof feedId === "number") {
                this.subscriberConnStates.set(feedId, (pc.connectionState || "new"));
                this.remoteNegotiationReady = true;
            }
            this.evaluate();
        });
        pc.addEventListener("signalingstatechange", () => {
            if (role === "publisher" && this.publisherPc === pc) {
                this.localSignalingState = pc.signalingState;
            }
            this.evaluate();
        });
    }
    tick() {
        this.sampleStats();
        this.evaluate();
        this.maybeRotate();
    }
    async sampleStats() {
        if (this.statsBusy)
            return;
        const now = Date.now();
        const intervalMs = this.status.state === "CONNECTED"
            ? APP_CONFIG.connectionStatus.statsIntervalConnectedMs
            : APP_CONFIG.connectionStatus.statsIntervalConnectingMs;
        if (now - this.lastStatsSampleAt < intervalMs)
            return;
        this.statsBusy = true;
        this.lastStatsSampleAt = now;
        try {
            const jobs = [];
            if (this.publisherPc) {
                jobs.push(this.publisherPc.getStats()
                    .then((report) => this.consumePublisherStats(report))
                    .catch((e) => this.logStatsError("publisher getStats failed", e)));
            }
            for (const [feedId, pc] of this.subscriberPcs.entries()) {
                jobs.push(pc.getStats()
                    .then((report) => this.consumeSubscriberStats(feedId, report))
                    .catch((e) => this.logStatsError(`subscriber getStats failed (feedId=${feedId})`, e)));
            }
            await Promise.all(jobs);
        }
        catch (e) {
            this.logStatsError("sampleStats failed", e);
        }
        this.statsBusy = false;
    }
    consumePublisherStats(report) {
        const now = Date.now();
        const byId = new Map();
        report.forEach((s) => byId.set(s.id, s));
        let selectedPairId = null;
        let rttMs = 0;
        let highLoss = false;
        let relayInUse = false;
        report.forEach((s) => {
            const anyS = s;
            if (s.type === "transport" && typeof anyS.selectedCandidatePairId === "string") {
                selectedPairId = anyS.selectedCandidatePairId;
            }
            if (s.type === "candidate-pair") {
                const isSelected = !!anyS.selected || !!anyS.nominated;
                if (!selectedPairId && isSelected)
                    selectedPairId = s.id;
                if (selectedPairId === s.id && typeof anyS.currentRoundTripTime === "number") {
                    rttMs = Math.max(rttMs, anyS.currentRoundTripTime * 1000);
                }
            }
            if (s.type === "remote-inbound-rtp" && (anyS.kind === "video" || anyS.mediaType === "video")) {
                const fractionLost = typeof anyS.fractionLost === "number" ? anyS.fractionLost : 0;
                if (fractionLost >= APP_CONFIG.connectionStatus.highPacketLossThreshold)
                    highLoss = true;
            }
            if (s.type === "inbound-rtp" && (anyS.kind === "video" || anyS.mediaType === "video")) {
                const packetsReceived = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
                const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
                const total = packetsReceived + packetsLost;
                if (total > APP_CONFIG.connectionStatus.packetLossMinPackets &&
                    packetsLost / total >= APP_CONFIG.connectionStatus.highPacketLossThreshold)
                    highLoss = true;
            }
        });
        if (selectedPairId) {
            if (this.selectedPairId && this.selectedPairId !== selectedPairId) {
                this.candidateSwitchAt = now;
            }
            this.selectedPairId = selectedPairId;
            const pair = byId.get(selectedPairId);
            if (pair) {
                const local = byId.get(pair.localCandidateId);
                const remote = byId.get(pair.remoteCandidateId);
                relayInUse = local?.candidateType === "relay" || remote?.candidateType === "relay";
            }
        }
        if (relayInUse) {
            if (this.relayDetectedAt === null)
                this.relayDetectedAt = now;
        }
        else {
            this.relayDetectedAt = null;
        }
        const highRtt = rttMs >= APP_CONFIG.connectionStatus.highRttMs;
        if (highRtt || highLoss) {
            if (this.localPoorSince === null)
                this.localPoorSince = now;
        }
        else {
            this.localPoorSince = null;
        }
    }
    consumeSubscriberStats(feedId, report) {
        const now = Date.now();
        let bytes = 0;
        report.forEach((s) => {
            const anyS = s;
            if (s.type === "inbound-rtp" && (anyS.kind === "video" || anyS.mediaType === "video") && typeof anyS.bytesReceived === "number") {
                bytes += anyS.bytesReceived;
            }
        });
        const prev = this.subscriberBytes.get(feedId) || { bytes: 0, growthAt: null };
        if (bytes > prev.bytes + APP_CONFIG.connectionStatus.bytesGrowthThreshold) {
            prev.growthAt = now;
            this.remoteMediaFlowAt = now;
        }
        prev.bytes = bytes;
        this.subscriberBytes.set(feedId, prev);
    }
    evaluate() {
        if (this.fatalError) {
            this.publishFatalError();
            return;
        }
        if (this.status.state === "SERVER_RETRYING" || this.status.state === "PEER_RETRYING") {
            return;
        }
        const now = Date.now();
        const liveRemoteVideo = this.hasLiveRemoteVideoTrack();
        const hasRemote = this.remoteParticipantCount > 0 || liveRemoteVideo;
        const localConnected = this.localIceState === "connected" || this.localIceState === "completed";
        const remoteConnected = Array.from(this.subscriberIceStates.values()).some(s => s === "connected" || s === "completed");
        const connectedIce = localConnected || remoteConnected;
        const mediaFlowing = this.remoteMediaFlowAt !== null && now - this.remoteMediaFlowAt <= APP_CONFIG.connectionStatus.mediaFlowRecentMs;
        const hasLocalVideo = this.localVideoTrackIds.size > 0;
        const anyFailed = this.localIceState === "failed" ||
            this.localConnState === "failed" ||
            Array.from(this.subscriberIceStates.values()).some(s => s === "failed") ||
            Array.from(this.subscriberConnStates.values()).some(s => s === "failed");
        if (anyFailed) {
            this.transition("FAILED");
            return;
        }
        const anyDisconnected = this.localConnState === "disconnected" ||
            Array.from(this.subscriberConnStates.values()).some(s => s === "disconnected");
        if (anyDisconnected) {
            if (this.disconnectedSince === null)
                this.disconnectedSince = now;
            this.transition("DEGRADED");
            return;
        }
        this.disconnectedSince = null;
        if (hasRemote && !hasLocalVideo) {
            this.transition("NEGOTIATING");
            return;
        }
        // Connected means both sides are exchanging media:
        // local video ready + remote video track is live, with stats flow when available.
        // Some environments do not expose stable inbound byte growth every sample,
        // so we accept recent remote track signal as a bounded fallback.
        const remoteTrackRecent = this.remoteTrackSeenAt !== null &&
            now - this.remoteTrackSeenAt <= APP_CONFIG.connectionStatus.mediaFlowRecentMs;
        const remoteMediaLive = liveRemoteVideo && (mediaFlowing || remoteTrackRecent);
        const transportReady = connectedIce || this.remoteNegotiationReady;
        if (hasRemote && hasLocalVideo && remoteMediaLive && transportReady) {
            this.transition("CONNECTED");
            return;
        }
        const relayRecent = this.relayDetectedAt !== null &&
            now - this.relayDetectedAt <= APP_CONFIG.connectionStatus.relayRecentMs;
        const candidateSwitchRecent = this.candidateSwitchAt !== null &&
            now - this.candidateSwitchAt <= APP_CONFIG.connectionStatus.candidateSwitchRecentMs;
        // LOCAL_SLOW rule set:
        // 1) ICE checking for >12s
        // 2) high RTT or packet loss from RTCPeerConnection stats
        // 3) relay-only path detected early in call setup
        const localSlowByChecking = this.checkingSince !== null &&
            now - this.checkingSince > APP_CONFIG.connectionStatus.localSlowCheckingMs;
        const localSlowByStats = this.localPoorSince !== null &&
            now - this.localPoorSince > APP_CONFIG.connectionStatus.localSlowStatsMs;
        const localSlowByRelayEarly = this.relayDetectedAt !== null &&
            this.joinStartedAt !== null &&
            now - this.joinStartedAt <= APP_CONFIG.connectionStatus.relayEarlyJoinWindowMs &&
            now - this.relayDetectedAt > APP_CONFIG.connectionStatus.relayEarlyThresholdMs &&
            !connectedIce;
        if (localSlowByChecking || localSlowByStats || localSlowByRelayEarly) {
            this.transition("LOCAL_SLOW");
            return;
        }
        // REMOTE_SLOW rule set:
        // remote participant exists and negotiation started, but no remote video track
        // or bytesReceived stays near zero for >10s.
        const remoteWaitAnchor = this.remoteParticipantSeenAt ?? this.joinedAt;
        const remoteWaitingTooLong = remoteWaitAnchor !== null &&
            now - remoteWaitAnchor > APP_CONFIG.connectionStatus.remoteSlowWaitMs;
        const remoteFlowStalled = hasRemote && this.remoteNegotiationReady && !liveRemoteVideo && remoteWaitingTooLong;
        if (remoteFlowStalled) {
            this.transition("REMOTE_SLOW");
            return;
        }
        // OPTIMIZING rule set:
        // relay usage or candidate switches indicate active path optimization.
        if (relayRecent || candidateSwitchRecent) {
            this.transition("OPTIMIZING");
            return;
        }
        if (!hasRemote) {
            this.transition(this.joinedAt && hasLocalVideo ? "WAITING_REMOTE" : "NEGOTIATING");
            return;
        }
        if (!connectedIce) {
            this.transition("NETWORK_CHECK");
            return;
        }
        if (this.localSignalingState !== "stable") {
            this.transition("NEGOTIATING");
            return;
        }
        this.transition("NEGOTIATING");
    }
    maybeRotate() {
        const cfg = CONNECTION_MESSAGES[this.status.state];
        if (!cfg.rotate)
            return;
        const now = Date.now();
        if (now < this.nextRotationAt)
            return;
        this.rotationCursor++;
        this.publishCurrent(true);
    }
    transition(next, forcePublish = false) {
        if (this.status.state !== next) {
            this.status.state = next;
            this.rotationCursor = 0;
            this.publishCurrent(true);
            return;
        }
        if (forcePublish) {
            this.publishCurrent(true);
        }
    }
    publishCurrent(force = false) {
        const cfg = CONNECTION_MESSAGES[this.status.state];
        const p = cfg.primary;
        const s = cfg.secondary;
        const primary = p[this.rotationCursor % p.length] || "";
        const secondary = s[this.rotationCursor % s.length] || "";
        const nextStatus = {
            owner: cfg.owner,
            severity: cfg.severity,
            primaryText: primary,
            secondaryText: secondary,
            state: this.status.state
        };
        if (nextStatus.state === "SERVER_RETRYING" && this.serverRetryMax > 0) {
            nextStatus.secondaryText = `Retry ${this.serverRetryAttempt}/${this.serverRetryMax}. Reconnecting to video server.`;
            if (this.serverRetryReason) {
                nextStatus.secondaryText += ` Reason: ${this.serverRetryReason}`;
            }
        }
        if (nextStatus.state === "PEER_RETRYING" && this.peerRetryMax > 0) {
            nextStatus.secondaryText = `Retry ${this.peerRetryAttempt}/${this.peerRetryMax}. Recovering TURN/peer connection.`;
            if (this.peerRetryReason) {
                nextStatus.secondaryText += ` Reason: ${this.peerRetryReason}`;
            }
        }
        if (nextStatus.state === "FAILED" && this.failedReason) {
            nextStatus.secondaryText = `Reason: ${this.failedReason}`;
        }
        if (cfg.rotate) {
            const span = CONNECTION_ROTATION_MAX_MS - CONNECTION_ROTATION_MIN_MS;
            this.nextRotationAt = Date.now() + CONNECTION_ROTATION_MIN_MS + Math.floor(Math.random() * (span + 1));
        }
        else {
            this.nextRotationAt = Number.MAX_SAFE_INTEGER;
        }
        const key = `${nextStatus.state}|${nextStatus.owner}|${nextStatus.primaryText}|${nextStatus.secondaryText}`;
        if (!force && this.lastPublishedKey === key)
            return;
        this.status = nextStatus;
        if (this.lastPublishedKey !== key) {
            this.logOwnership(nextStatus);
            this.lastPublishedKey = key;
        }
        this.onUpdate?.(nextStatus);
    }
    logOwnership(status) {
        const prefix = status.owner === "LOCAL"
            ? "User"
            : status.owner === "REMOTE"
                ? "Remote"
                : "System";
        const msg = status.secondaryText
            ? `${status.primaryText} ${status.secondaryText}`
            : status.primaryText;
        console.log(`${prefix}: ${msg}`);
    }
    publishFatalError() {
        if (!this.fatalError)
            return;
        const nextStatus = {
            owner: "SYSTEM",
            severity: "error",
            primaryText: this.fatalError.primary,
            secondaryText: this.fatalError.secondary,
            state: "FAILED"
        };
        const key = `${nextStatus.state}|${nextStatus.owner}|${nextStatus.primaryText}|${nextStatus.secondaryText}`;
        this.status = nextStatus;
        if (this.lastPublishedKey !== key) {
            this.logOwnership(nextStatus);
            this.lastPublishedKey = key;
        }
        this.onUpdate?.(nextStatus);
    }
    logStatsError(message, err) {
        const now = Date.now();
        if (now - this.lastStatsErrorLogAt < 5000)
            return;
        this.lastStatsErrorLogAt = now;
        Logger.error(ErrorMessages.connectionStatusStatsError(message), err);
    }
    formatFailureReason(reason) {
        const raw = String(reason ?? "").replace(/\s+/g, " ").trim();
        if (!raw)
            return "";
        const maxLen = 220;
        if (raw.length <= maxLen)
            return raw;
        return `${raw.slice(0, maxLen - 3)}...`;
    }
}
class CallMonitoringStat {
    constructor(bus, remoteVideo, callbacks) {
        this.bus = bus;
        this.remoteVideo = remoteVideo;
        this.callbacks = callbacks;
        this.mediaStatsTimer = null;
        this.metricsPrevAt = 0;
        this.mediaStatsStartedAt = 0;
        this.outboundPrev = { audio: 0, video: 0 };
        this.outboundAudioPacketsPrev = 0;
        this.inboundPrev = { audio: 0, video: 0 };
        this.inboundPacketsPrev = { audio: 0, video: 0 };
        this.inboundVideoFramesDecodedPrev = 0;
        this.remoteInboundPrev = { audioPackets: 0, videoPackets: 0 };
        this.remoteReceiveGrowthAt = { audio: 0, video: 0 };
        this.localReceiveGrowthAt = { audio: 0, video: 0 };
        this.remoteVideoPlaybackAt = 0;
        this.lastRemoteVideoTime = 0;
        this.localAudioPlaybackAt = 0;
        this.lastPeerNetworkTelemetryAt = 0;
    }
    start() {
        this.stop();
        this.mediaStatsStartedAt = Date.now();
        this.metricsPrevAt = 0;
        this.outboundPrev = { audio: 0, video: 0 };
        this.outboundAudioPacketsPrev = 0;
        this.inboundPrev = { audio: 0, video: 0 };
        this.inboundPacketsPrev = { audio: 0, video: 0 };
        this.inboundVideoFramesDecodedPrev = 0;
        this.remoteInboundPrev = { audioPackets: 0, videoPackets: 0 };
        this.remoteReceiveGrowthAt = { audio: 0, video: 0 };
        this.localReceiveGrowthAt = { audio: 0, video: 0 };
        this.remoteVideoPlaybackAt = 0;
        this.lastRemoteVideoTime = 0;
        this.localAudioPlaybackAt = 0;
        this.lastPeerNetworkTelemetryAt = 0;
        this.mediaStatsTimer = window.setInterval(() => {
            void this.sample();
        }, APP_CONFIG.mediaTelemetry.sampleIntervalMs);
        void this.sample();
    }
    stop() {
        if (this.mediaStatsTimer !== null) {
            window.clearInterval(this.mediaStatsTimer);
            this.mediaStatsTimer = null;
        }
        this.mediaStatsStartedAt = 0;
        this.lastPeerNetworkTelemetryAt = 0;
        this.bus.emit("media-io", {
            bytes: { audioSent: 0, audioReceived: 0, videoSent: 0, videoReceived: 0 },
            quality: { localJitterMs: null, localLossPct: null, remoteJitterMs: null, remoteLossPct: null },
            issues: [],
            matrix: {
                remoteReceivingYourVideo: "Not possible",
                remoteReceivingYourAudio: "Not possible",
                remoteAudioPlaybackStatus: "Not possible",
                remoteVideoPlaybackStatus: "Not possible",
                localReceivingYourVideo: "Not possible",
                localReceivingYourAudio: "Not possible",
                localAudioPlaybackStatus: "Not possible",
                localVideoPlaybackStatus: "Not possible"
            },
            ts: Date.now()
        });
    }
    async sample() {
        const now = Date.now();
        const publisher = this.callbacks.getPublisherPc();
        const subscribers = this.callbacks.getSubscriberPcs();
        const remoteCount = this.callbacks.getRemoteParticipantCount();
        const remoteMs = this.remoteVideo.srcObject;
        const hasLiveRemoteTrack = !!remoteMs?.getTracks().some((t) => t.readyState === "live");
        const remotePresent = remoteCount > 0 || subscribers.length > 0 || hasLiveRemoteTrack;
        const elapsedMs = this.mediaStatsStartedAt > 0 ? now - this.mediaStatsStartedAt : 0;
        const inWarmup = elapsedMs <= APP_CONFIG.mediaTelemetry.stallWindowMs;
        if (!publisher && subscribers.length === 0) {
            const joined = this.callbacks.getJoinedRoom();
            const pendingOrNotPossible = (joined && inWarmup) ? "Pending" : "Not possible";
            const playbackPendingOrNotPossible = (joined && inWarmup) ? "Pending" : "Not possible";
            const localReceiveState = remotePresent ? (inWarmup ? "Pending" : "Not possible") : "Not possible";
            const localPlaybackState = remotePresent ? (inWarmup ? "Pending" : "Not possible") : "Not possible";
            this.bus.emit("media-io", {
                bytes: { audioSent: 0, audioReceived: 0, videoSent: 0, videoReceived: 0 },
                quality: { localJitterMs: null, localLossPct: null, remoteJitterMs: null, remoteLossPct: null },
                issues: [],
                matrix: {
                    remoteReceivingYourVideo: pendingOrNotPossible,
                    remoteReceivingYourAudio: pendingOrNotPossible,
                    remoteAudioPlaybackStatus: playbackPendingOrNotPossible,
                    remoteVideoPlaybackStatus: playbackPendingOrNotPossible,
                    localReceivingYourVideo: localReceiveState,
                    localReceivingYourAudio: localReceiveState,
                    localAudioPlaybackStatus: localPlaybackState,
                    localVideoPlaybackStatus: localPlaybackState
                },
                ts: now
            });
            return;
        }
        const publisherMetrics = publisher ? await this.collectPublisherMetrics(publisher) : {
            audioBytesSent: 0,
            audioPacketsSent: 0,
            videoBytesSent: 0,
            remoteInboundAudioPacketsReceived: null,
            remoteInboundVideoPacketsReceived: null,
            localJitterMs: null,
            localLossPct: null
        };
        const subscriberMetrics = await this.collectSubscriberMetrics(subscribers);
        const prevAt = this.metricsPrevAt;
        this.metricsPrevAt = now;
        const audioSentDelta = Math.max(0, publisherMetrics.audioBytesSent - this.outboundPrev.audio);
        const audioPacketsSentDelta = Math.max(0, publisherMetrics.audioPacketsSent - this.outboundAudioPacketsPrev);
        const videoSentDelta = Math.max(0, publisherMetrics.videoBytesSent - this.outboundPrev.video);
        const audioRecvDelta = Math.max(0, subscriberMetrics.audioBytesReceived - this.inboundPrev.audio);
        const videoRecvDelta = Math.max(0, subscriberMetrics.videoBytesReceived - this.inboundPrev.video);
        const audioPacketsRecvDelta = Math.max(0, subscriberMetrics.audioPacketsReceived - this.inboundPacketsPrev.audio);
        const videoPacketsRecvDelta = Math.max(0, subscriberMetrics.videoPacketsReceived - this.inboundPacketsPrev.video);
        const videoFramesDecodedDelta = Math.max(0, subscriberMetrics.videoFramesDecoded - this.inboundVideoFramesDecodedPrev);
        this.outboundPrev = { audio: publisherMetrics.audioBytesSent, video: publisherMetrics.videoBytesSent };
        this.outboundAudioPacketsPrev = publisherMetrics.audioPacketsSent;
        this.inboundPrev = { audio: subscriberMetrics.audioBytesReceived, video: subscriberMetrics.videoBytesReceived };
        this.inboundPacketsPrev = {
            audio: subscriberMetrics.audioPacketsReceived,
            video: subscriberMetrics.videoPacketsReceived
        };
        this.inboundVideoFramesDecodedPrev = subscriberMetrics.videoFramesDecoded;
        const localOutgoingAudioTrack = this.callbacks.getPreferredAudioTrack();
        const localOutgoingAudioActive = !!localOutgoingAudioTrack &&
            localOutgoingAudioTrack.readyState === "live" &&
            localOutgoingAudioTrack.enabled !== false &&
            !this.callbacks.isLocalAudioMuted();
        let remoteAudioReceiveStatus = remotePresent ? "Pending" : "Not possible";
        let remoteVideoReceiveStatus = remotePresent ? "Pending" : "Not possible";
        if (remotePresent) {
            if (publisherMetrics.remoteInboundAudioPacketsReceived === null) {
                if (publisher && (audioSentDelta > 0 || audioPacketsSentDelta > 0))
                    this.remoteReceiveGrowthAt.audio = now;
                if (!publisher) {
                    remoteAudioReceiveStatus = "Pending";
                }
                else if (this.remoteReceiveGrowthAt.audio > 0 && now - this.remoteReceiveGrowthAt.audio <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
                    remoteAudioReceiveStatus = "Yes";
                }
                else if (inWarmup) {
                    remoteAudioReceiveStatus = "Pending";
                }
                else {
                    remoteAudioReceiveStatus = "Not possible";
                }
            }
            else {
                const delta = publisherMetrics.remoteInboundAudioPacketsReceived - this.remoteInboundPrev.audioPackets;
                if (delta > 0)
                    this.remoteReceiveGrowthAt.audio = now;
                remoteAudioReceiveStatus =
                    this.remoteReceiveGrowthAt.audio > 0 && now - this.remoteReceiveGrowthAt.audio <= APP_CONFIG.mediaTelemetry.stallWindowMs
                        ? "Yes"
                        : "No";
            }
            if (publisherMetrics.remoteInboundVideoPacketsReceived === null) {
                if (publisher && videoSentDelta > 0)
                    this.remoteReceiveGrowthAt.video = now;
                if (!publisher) {
                    remoteVideoReceiveStatus = "Pending";
                }
                else if (this.remoteReceiveGrowthAt.video > 0 && now - this.remoteReceiveGrowthAt.video <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
                    remoteVideoReceiveStatus = "Yes";
                }
                else if (inWarmup) {
                    remoteVideoReceiveStatus = "Pending";
                }
                else {
                    remoteVideoReceiveStatus = "Not possible";
                }
            }
            else {
                const delta = publisherMetrics.remoteInboundVideoPacketsReceived - this.remoteInboundPrev.videoPackets;
                if (delta > 0)
                    this.remoteReceiveGrowthAt.video = now;
                remoteVideoReceiveStatus =
                    this.remoteReceiveGrowthAt.video > 0 && now - this.remoteReceiveGrowthAt.video <= APP_CONFIG.mediaTelemetry.stallWindowMs
                        ? "Yes"
                        : "No";
            }
        }
        else {
            this.remoteReceiveGrowthAt.audio = 0;
            this.remoteReceiveGrowthAt.video = 0;
        }
        this.remoteInboundPrev = {
            audioPackets: publisherMetrics.remoteInboundAudioPacketsReceived ?? this.remoteInboundPrev.audioPackets,
            videoPackets: publisherMetrics.remoteInboundVideoPacketsReceived ?? this.remoteInboundPrev.videoPackets
        };
        if (videoRecvDelta > 0 || videoPacketsRecvDelta > 0 || videoFramesDecodedDelta > 0) {
            this.localReceiveGrowthAt.video = now;
        }
        if (audioRecvDelta > 0 || audioPacketsRecvDelta > 0) {
            this.localReceiveGrowthAt.audio = now;
        }
        const localReceivingVideo = this.deriveLocalReceiveStatus(remotePresent, this.localReceiveGrowthAt.video, now, inWarmup);
        const localReceivingAudio = this.deriveLocalReceiveStatus(remotePresent, this.localReceiveGrowthAt.audio, now, inWarmup);
        const localVideoPlaybackStatus = this.deriveLocalVideoPlaybackStatus(now, remotePresent, inWarmup, videoRecvDelta, videoPacketsRecvDelta, videoFramesDecodedDelta, subscriberMetrics.hasVideoTrack);
        const localAudioPlaybackStatus = this.deriveLocalAudioPlaybackStatus(now, audioRecvDelta, audioPacketsRecvDelta, subscriberMetrics.hasAudioTrack, remotePresent, inWarmup);
        const peerTelemetry = this.callbacks.getPeerTelemetry(now);
        const remoteAudioPlaybackStatus = peerTelemetry?.audioPlaybackStatus ?? (remotePresent ? "Pending" : "Not possible");
        const remoteVideoPlaybackStatus = peerTelemetry?.videoPlaybackStatus ?? (remotePresent ? "Pending" : "Not possible");
        const issues = [];
        if (remoteAudioReceiveStatus === "No" && remotePresent && localOutgoingAudioActive) {
            issues.push("your audio not working");
        }
        if (localReceivingAudio === "No" && remotePresent) {
            issues.push("participant audio not working");
        }
        if (localReceivingVideo === "No" && remotePresent) {
            issues.push("participant video not working");
        }
        const snapshot = {
            bytes: {
                audioSent: publisherMetrics.audioBytesSent,
                audioReceived: subscriberMetrics.audioBytesReceived,
                videoSent: publisherMetrics.videoBytesSent,
                videoReceived: subscriberMetrics.videoBytesReceived
            },
            quality: {
                localJitterMs: publisherMetrics.localJitterMs,
                localLossPct: publisherMetrics.localLossPct,
                remoteJitterMs: subscriberMetrics.remoteJitterMs,
                remoteLossPct: subscriberMetrics.remoteLossPct
            },
            issues,
            matrix: {
                remoteReceivingYourVideo: remoteVideoReceiveStatus,
                remoteReceivingYourAudio: remoteAudioReceiveStatus,
                remoteAudioPlaybackStatus,
                remoteVideoPlaybackStatus,
                localReceivingYourVideo: localReceivingVideo,
                localReceivingYourAudio: localReceivingAudio,
                localAudioPlaybackStatus,
                localVideoPlaybackStatus
            },
            ts: now
        };
        this.bus.emit("media-io", snapshot);
        if (prevAt > 0) {
            const seconds = (now - prevAt) / 1000;
            const totalSentDelta = audioSentDelta + videoSentDelta;
            const totalRecvDelta = audioRecvDelta + videoRecvDelta;
            this.callbacks.emitPeerTelemetry({
                type: "vcx-peer-telemetry",
                ts: now,
                audioPlaybackStatus: localAudioPlaybackStatus,
                videoPlaybackStatus: localVideoPlaybackStatus
            });
            const canSendPeerNetwork = APP_CONFIG.mediaTelemetry.enablePeerNetworkTelemetry &&
                now - this.lastPeerNetworkTelemetryAt >= APP_CONFIG.mediaTelemetry.networkTelemetryIntervalMs;
            if (canSendPeerNetwork) {
                this.lastPeerNetworkTelemetryAt = now;
                this.callbacks.emitPeerNetworkTelemetry({
                    type: "vcx-peer-network",
                    ts: now,
                    uploadKbps: seconds > 0 ? (totalSentDelta * 8) / 1000 / seconds : null,
                    downloadKbps: seconds > 0 ? (totalRecvDelta * 8) / 1000 / seconds : null,
                    lossPct: subscriberMetrics.remoteLossPct,
                    jitterMs: subscriberMetrics.remoteJitterMs
                });
            }
        }
    }
    async collectPublisherMetrics(pc) {
        try {
            const report = await pc.getStats();
            let audioBytesSent = 0;
            let audioPacketsSent = 0;
            let videoBytesSent = 0;
            let remoteInboundAudioPacketsReceived = null;
            let remoteInboundVideoPacketsReceived = null;
            let localJitterMs = null;
            let lost = 0;
            let total = 0;
            report.forEach((s) => {
                const anyS = s;
                if (s.type === "outbound-rtp" && !anyS.isRemote) {
                    if (anyS.kind === "audio" || anyS.mediaType === "audio") {
                        if (typeof anyS.bytesSent === "number")
                            audioBytesSent += anyS.bytesSent;
                        if (typeof anyS.packetsSent === "number")
                            audioPacketsSent += anyS.packetsSent;
                    }
                    if (anyS.kind === "video" || anyS.mediaType === "video") {
                        if (typeof anyS.bytesSent === "number")
                            videoBytesSent += anyS.bytesSent;
                    }
                }
                if (s.type === "remote-inbound-rtp") {
                    if (typeof anyS.jitter === "number") {
                        const jitterMs = anyS.jitter * 1000;
                        localJitterMs = localJitterMs === null ? jitterMs : Math.max(localJitterMs, jitterMs);
                    }
                    const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
                    const packetsReceived = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
                    lost += packetsLost;
                    total += packetsLost + packetsReceived;
                    if ((anyS.kind === "audio" || anyS.mediaType === "audio") && typeof anyS.packetsReceived === "number") {
                        remoteInboundAudioPacketsReceived = anyS.packetsReceived;
                    }
                    if ((anyS.kind === "video" || anyS.mediaType === "video") && typeof anyS.packetsReceived === "number") {
                        remoteInboundVideoPacketsReceived = anyS.packetsReceived;
                    }
                }
            });
            return {
                audioBytesSent,
                audioPacketsSent,
                videoBytesSent,
                remoteInboundAudioPacketsReceived,
                remoteInboundVideoPacketsReceived,
                localJitterMs,
                localLossPct: total > 0 ? (lost / total) * 100 : null
            };
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_PUBLISHER_METRICS_FAILED, e);
            return {
                audioBytesSent: this.outboundPrev.audio,
                audioPacketsSent: this.outboundAudioPacketsPrev,
                videoBytesSent: this.outboundPrev.video,
                remoteInboundAudioPacketsReceived: null,
                remoteInboundVideoPacketsReceived: null,
                localJitterMs: null,
                localLossPct: null
            };
        }
    }
    async collectSubscriberMetrics(subscribers) {
        let audioBytesReceived = 0;
        let videoBytesReceived = 0;
        let audioPacketsReceived = 0;
        let videoPacketsReceived = 0;
        let videoFramesDecoded = 0;
        let remoteJitterMs = null;
        let lost = 0;
        let total = 0;
        let hasAudioTrack = false;
        let hasVideoTrack = false;
        await Promise.all(subscribers.map(async (pc) => {
            try {
                const report = await pc.getStats();
                report.forEach((s) => {
                    const anyS = s;
                    if (s.type === "inbound-rtp" && !anyS.isRemote) {
                        if (anyS.kind === "audio" || anyS.mediaType === "audio") {
                            hasAudioTrack = true;
                            if (typeof anyS.bytesReceived === "number")
                                audioBytesReceived += anyS.bytesReceived;
                            if (typeof anyS.packetsReceived === "number")
                                audioPacketsReceived += anyS.packetsReceived;
                        }
                        if (anyS.kind === "video" || anyS.mediaType === "video") {
                            hasVideoTrack = true;
                            if (typeof anyS.bytesReceived === "number")
                                videoBytesReceived += anyS.bytesReceived;
                            if (typeof anyS.packetsReceived === "number")
                                videoPacketsReceived += anyS.packetsReceived;
                            if (typeof anyS.framesDecoded === "number")
                                videoFramesDecoded += anyS.framesDecoded;
                        }
                        if (typeof anyS.jitter === "number") {
                            const jitterMs = anyS.jitter * 1000;
                            remoteJitterMs = remoteJitterMs === null ? jitterMs : Math.max(remoteJitterMs, jitterMs);
                        }
                        const packetsLost = typeof anyS.packetsLost === "number" ? anyS.packetsLost : 0;
                        const packetsReceived = typeof anyS.packetsReceived === "number" ? anyS.packetsReceived : 0;
                        lost += packetsLost;
                        total += packetsLost + packetsReceived;
                    }
                });
            }
            catch (e) {
                Logger.error(ErrorMessages.CALL_SUBSCRIBER_METRICS_FAILED, e);
            }
        }));
        return {
            audioBytesReceived,
            videoBytesReceived,
            audioPacketsReceived,
            videoPacketsReceived,
            videoFramesDecoded,
            remoteJitterMs,
            remoteLossPct: total > 0 ? (lost / total) * 100 : null,
            hasAudioTrack,
            hasVideoTrack
        };
    }
    deriveLocalReceiveStatus(remotePresent, growthAt, now, inWarmup) {
        if (!remotePresent)
            return "Not possible";
        if (growthAt > 0 && now - growthAt <= APP_CONFIG.mediaTelemetry.stallWindowMs)
            return "Yes";
        if (inWarmup)
            return "Pending";
        return "No";
    }
    deriveLocalVideoPlaybackStatus(now, remotePresent, inWarmup, videoRecvDelta, videoPacketsRecvDelta, videoFramesDecodedDelta, hasVideoTrack) {
        if (!remotePresent)
            return "Not possible";
        if (!hasVideoTrack)
            return inWarmup ? "Pending" : "Not possible";
        const hasTransportProgress = videoRecvDelta > 0 ||
            videoPacketsRecvDelta > 0 ||
            videoFramesDecodedDelta > 0;
        const currentTime = Number.isFinite(this.remoteVideo.currentTime) ? this.remoteVideo.currentTime : 0;
        if (currentTime > this.lastRemoteVideoTime + 0.03) {
            this.lastRemoteVideoTime = currentTime;
            this.remoteVideoPlaybackAt = now;
            return "Active";
        }
        if (hasTransportProgress) {
            this.remoteVideoPlaybackAt = now;
            return "Active";
        }
        if (this.remoteVideoPlaybackAt === 0 && currentTime > 0) {
            this.remoteVideoPlaybackAt = now;
            return "Active";
        }
        if (this.remoteVideoPlaybackAt === 0 && inWarmup) {
            return "Pending";
        }
        if (this.remoteVideoPlaybackAt > 0 && now - this.remoteVideoPlaybackAt <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
            return "Active";
        }
        return "Stalled";
    }
    deriveLocalAudioPlaybackStatus(now, audioRecvDelta, audioPacketsRecvDelta, hasAudioTrack, remotePresent, inWarmup) {
        if (!remotePresent)
            return "Not possible";
        if (!hasAudioTrack)
            return inWarmup ? "Pending" : "Not possible";
        if (audioRecvDelta > 0 || audioPacketsRecvDelta > 0) {
            this.localAudioPlaybackAt = now;
            return "Active";
        }
        if (this.localAudioPlaybackAt === 0 && inWarmup) {
            return "Pending";
        }
        if (this.localAudioPlaybackAt > 0 && now - this.localAudioPlaybackAt <= APP_CONFIG.mediaTelemetry.stallWindowMs) {
            return "Active";
        }
        return "Stalled";
    }
}
class JanusGateway {
    constructor() {
        this.janus = null;
        this.publisher = null;
        this.opaqueId = "videocx-ui-" + Janus.randomString(12);
    }
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
    createSession(server, iceServers, ok, destroyed, onError) {
        Logger.setStatus(ErrorMessages.JANUS_CREATING_SESSION);
        Logger.user(`Creating Janus session: ${server}`);
        this.janus = new Janus({
            server,
            // ✅ TURN/STUN config (from IMS)
            // Janus will use these ICE servers for the underlying RTCPeerConnection(s)
            iceServers: iceServers ?? [],
            success: ok,
            error: (e) => {
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
    attachPublisher(onAttached, onMessage, onLocalTrack, onCleanup, onError, onSlowLink) {
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
            success: (h) => {
                this.publisher = h;
                Logger.user(`Publisher plugin attached. handleId=${h.getId?.() ?? "?"}`);
                onAttached(h);
            },
            error: (e) => {
                Logger.setStatus(ErrorMessages.janusAttachErrorStatus(e));
                Logger.user(`[janus-info] ${ErrorMessages.janusAttachErrorLog(e)}`);
                onError?.(e);
            },
            onmessage: (msg, jsep) => {
                onMessage(msg, jsep);
            },
            onlocaltrack: (track, on) => {
                onLocalTrack(track, on);
            },
            slowLink: (uplink, lost, mid) => {
                onSlowLink?.({
                    uplink: !!uplink,
                    lost: Number.isFinite(lost) ? Number(lost) : 0,
                    mid: typeof mid === "string" ? mid : null
                });
            },
            onslowlink: (uplink, lost, mid) => {
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
        }
        catch (e) {
            Logger.error(ErrorMessages.JANUS_PUBLISHER_DETACH_FAILED, e);
        }
        this.publisher = null;
        try {
            this.janus?.destroy?.();
        }
        catch (e) {
            Logger.error(ErrorMessages.JANUS_DESTROY_FAILED, e);
        }
        this.janus = null;
    }
}
class RemoteFeedManager {
    constructor(janus, roomId, privateId, opaqueId, media, remoteVideo, observer) {
        this.janus = janus;
        this.roomId = roomId;
        this.privateId = privateId;
        this.opaqueId = opaqueId;
        this.media = media;
        this.remoteVideo = remoteVideo;
        this.observer = observer;
        this.feeds = new Map();
        this.feedTracks = new Map();
        this.pendingFeedAttach = new Set();
        this.pendingAttachTimers = new Map();
        this.feedStartTimers = new Map();
        this.retryTimers = new Map();
        this.retryAttempts = new Map();
        this.retryBlockedUntil = new Map();
    }
    notifySubscriberPcReady(feedId, handle) {
        const pc = handle?.webrtcStuff?.pc;
        if (!pc)
            return;
        this.observer?.onSubscriberPcReady?.(feedId, pc);
    }
    clearAttachTimer(feedId) {
        const t = this.pendingAttachTimers.get(feedId);
        if (t !== undefined) {
            window.clearTimeout(t);
            this.pendingAttachTimers.delete(feedId);
        }
    }
    clearFeedStartTimer(feedId) {
        const t = this.feedStartTimers.get(feedId);
        if (t !== undefined) {
            window.clearTimeout(t);
            this.feedStartTimers.delete(feedId);
        }
    }
    clearRetryTimer(feedId) {
        const t = this.retryTimers.get(feedId);
        if (t !== undefined) {
            window.clearTimeout(t);
            this.retryTimers.delete(feedId);
        }
    }
    resetRetryState(feedId) {
        this.retryAttempts.delete(feedId);
        this.retryBlockedUntil.delete(feedId);
    }
    scheduleReattach(feedId, reason) {
        if (this.retryTimers.has(feedId))
            return;
        const now = Date.now();
        const blockedUntil = this.retryBlockedUntil.get(feedId) ?? 0;
        if (blockedUntil > now) {
            Logger.warn(ErrorMessages.remoteFeedRetryBlocked(feedId, new Date(blockedUntil).toISOString()));
            return;
        }
        const maxAttempts = APP_CONFIG.call.remoteFeedRetryMaxAttempts;
        const attempt = (this.retryAttempts.get(feedId) ?? 0) + 1;
        this.retryAttempts.set(feedId, attempt);
        if (attempt > maxAttempts) {
            const cooldownUntil = now + APP_CONFIG.call.remoteFeedRetryCooldownMs;
            this.retryAttempts.set(feedId, 0);
            this.retryBlockedUntil.set(feedId, cooldownUntil);
            Logger.error(ErrorMessages.remoteFeedRetriesExhausted(feedId, maxAttempts, reason));
            this.observer?.onRemoteFeedRetryExhausted?.(feedId, maxAttempts);
            return;
        }
        const baseDelayMs = APP_CONFIG.call.remoteFeedRetryDelayMs;
        const maxDelayMs = APP_CONFIG.call.remoteFeedRetryMaxDelayMs;
        const jitterMaxMs = APP_CONFIG.call.remoteFeedRetryJitterMs;
        const backoffDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)));
        const jitter = Math.floor(Math.random() * Math.max(1, jitterMaxMs));
        const delayMs = backoffDelay + jitter;
        Logger.warn(ErrorMessages.remoteFeedRetryScheduled(feedId, attempt, maxAttempts, delayMs, reason));
        const t = window.setTimeout(() => {
            this.retryTimers.delete(feedId);
            this.addFeed(feedId);
        }, delayMs);
        this.retryTimers.set(feedId, t);
    }
    addFeed(feedId) {
        if (this.feeds.has(feedId) || this.pendingFeedAttach.has(feedId))
            return;
        const blockedUntil = this.retryBlockedUntil.get(feedId) ?? 0;
        if (blockedUntil > Date.now()) {
            Logger.warn(ErrorMessages.remoteFeedAddSkippedCooldown(feedId));
            return;
        }
        if (blockedUntil !== 0) {
            this.retryBlockedUntil.delete(feedId);
        }
        if (!this.janus) {
            Logger.error(ErrorMessages.remoteFeedAttachSkippedNotReady(feedId));
            return;
        }
        this.clearRetryTimer(feedId);
        this.pendingFeedAttach.add(feedId);
        this.clearAttachTimer(feedId);
        const attachTimer = window.setTimeout(() => {
            if (!this.pendingFeedAttach.has(feedId))
                return;
            this.pendingFeedAttach.delete(feedId);
            this.clearAttachTimer(feedId);
            Logger.error(ErrorMessages.remoteFeedAttachTimedOut(feedId));
            this.scheduleReattach(feedId, ErrorMessages.REMOTE_ATTACH_TIMEOUT_REASON);
        }, APP_CONFIG.call.remoteFeedAttachTimeoutMs);
        this.pendingAttachTimers.set(feedId, attachTimer);
        let remoteHandle = null;
        this.janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: (h) => {
                remoteHandle = h;
                this.pendingFeedAttach.delete(feedId);
                this.clearAttachTimer(feedId);
                this.feeds.set(feedId, h);
                // PC may already exist for some browsers/Janus timings.
                this.notifySubscriberPcReady(feedId, h);
                this.resetRetryState(feedId);
                this.clearFeedStartTimer(feedId);
                const startTimer = window.setTimeout(() => {
                    if (!this.feeds.has(feedId))
                        return;
                    Logger.error(ErrorMessages.remoteFeedDidNotStartInTime(feedId));
                    this.removeFeed(feedId, true, true);
                }, APP_CONFIG.call.remoteFeedStartTimeoutMs);
                this.feedStartTimers.set(feedId, startTimer);
                h.send({ message: { request: "join", room: this.roomId, ptype: "subscriber", feed: feedId, private_id: this.privateId } });
            },
            error: (e) => {
                this.pendingFeedAttach.delete(feedId);
                this.clearAttachTimer(feedId);
                Logger.error(ErrorMessages.REMOTE_ATTACH_ERROR_PREFIX + JSON.stringify(e));
                this.scheduleReattach(feedId, ErrorMessages.remoteFeedAttachErrorReason(e));
            },
            onmessage: (msg, jsep) => {
                const data = msg?.plugindata?.data;
                if (data?.error || data?.error_code) {
                    Logger.error(ErrorMessages.remoteFeedPluginError(feedId, data));
                }
                if (msg?.janus === "hangup") {
                    Logger.error(ErrorMessages.remoteFeedHangup(feedId, msg?.reason || ErrorMessages.REMOTE_HANGUP_REASON_UNKNOWN));
                    this.removeFeed(feedId, true, true);
                    return;
                }
                if (jsep) {
                    this.clearFeedStartTimer(feedId);
                    // PC may appear only when remote SDP flow reaches this point.
                    this.notifySubscriberPcReady(feedId, remoteHandle);
                    const answerTracks = [
                        { type: "audio", capture: false, recv: true },
                        { type: "video", capture: false, recv: true }
                    ];
                    if (APP_CONFIG.mediaTelemetry.enablePeerTelemetry) {
                        answerTracks.push({ type: "data" });
                    }
                    remoteHandle.createAnswer({
                        jsep,
                        tracks: answerTracks,
                        success: (ans) => remoteHandle.send({ message: { request: "start", room: this.roomId }, jsep: ans }),
                        error: (e) => {
                            Logger.error(ErrorMessages.REMOTE_ANSWER_ERROR_PREFIX + JSON.stringify(e));
                            this.removeFeed(feedId, true, true);
                        }
                    });
                }
            },
            ondata: (payload) => {
                if (!payload || typeof payload !== "string")
                    return;
                try {
                    const parsed = JSON.parse(payload);
                    if (parsed?.type === "vcx-peer-telemetry") {
                        this.observer?.onRemoteTelemetry?.(feedId, parsed);
                        return;
                    }
                    if (parsed?.type === "vcx-peer-network") {
                        this.observer?.onRemoteNetworkTelemetry?.(feedId, parsed);
                    }
                }
                catch (e) {
                    Logger.error(ErrorMessages.remoteFeedTelemetryParseFailed(feedId), e);
                }
            },
            slowLink: (uplink, lost, mid) => {
                this.observer?.onSlowLink?.(feedId, {
                    uplink: !!uplink,
                    lost: Number.isFinite(lost) ? Number(lost) : 0,
                    mid: typeof mid === "string" ? mid : null
                });
            },
            onslowlink: (uplink, lost, mid) => {
                this.observer?.onSlowLink?.(feedId, {
                    uplink: !!uplink,
                    lost: Number.isFinite(lost) ? Number(lost) : 0,
                    mid: typeof mid === "string" ? mid : null
                });
            },
            onlocaltrack: () => { },
            onremotetrack: (track, _mid, on) => {
                // Last chance to bind subscriber PC if it appeared late.
                this.notifySubscriberPcReady(feedId, remoteHandle);
                this.observer?.onRemoteTrackSignal?.(feedId, track, on);
                if (on) {
                    this.resetRetryState(feedId);
                    this.clearFeedStartTimer(feedId);
                }
                let byId = this.feedTracks.get(feedId);
                if (!byId) {
                    byId = new Map();
                    this.feedTracks.set(feedId, byId);
                }
                if (!on) {
                    const prev = byId.get(track.id);
                    if (prev) {
                        this.media.removeRemoteTrack(this.remoteVideo, prev);
                        byId.delete(track.id);
                    }
                    else {
                        this.media.removeRemoteTrack(this.remoteVideo, track);
                    }
                    return;
                }
                const existingSameKind = Array.from(byId.values()).find(t => t.kind === track.kind && t.id !== track.id);
                if (existingSameKind) {
                    this.media.removeRemoteTrack(this.remoteVideo, existingSameKind);
                    byId.delete(existingSameKind.id);
                }
                byId.set(track.id, track);
                this.media.setRemoteTrack(this.remoteVideo, track);
            },
            oncleanup: () => {
                this.clearFeedStartTimer(feedId);
                this.removeFeed(feedId, false, true);
            }
        });
    }
    removeFeed(id, detach = true, notify = true) {
        this.pendingFeedAttach.delete(id);
        this.clearAttachTimer(id);
        this.clearFeedStartTimer(id);
        this.clearRetryTimer(id);
        let removed = false;
        const h = this.feeds.get(id);
        if (h) {
            if (detach) {
                try {
                    h.detach();
                }
                catch (e) {
                    Logger.error(ErrorMessages.remoteFeedDetachFailed(id), e);
                }
            }
            this.feeds.delete(id);
            removed = true;
        }
        const tracks = this.feedTracks.get(id);
        if (tracks) {
            tracks.forEach(t => this.media.removeRemoteTrack(this.remoteVideo, t));
            this.feedTracks.delete(id);
            removed = true;
        }
        if (removed && notify) {
            this.observer?.onRemoteFeedCleanup?.(id);
        }
    }
    cleanupAll() {
        this.pendingAttachTimers.forEach(t => window.clearTimeout(t));
        this.pendingAttachTimers.clear();
        this.feedStartTimers.forEach(t => window.clearTimeout(t));
        this.feedStartTimers.clear();
        this.retryTimers.forEach(t => window.clearTimeout(t));
        this.retryTimers.clear();
        this.retryAttempts.clear();
        this.retryBlockedUntil.clear();
        this.pendingFeedAttach.clear();
        Array.from(this.feeds.keys()).forEach(id => this.removeFeed(id, true, false));
        this.media.clearRemote(this.remoteVideo);
    }
}
class RecordingController {
    constructor(deps) {
        this.deps = deps;
        this.groupId = null;
        this.meetingId = null;
        this.recording = false;
        this.currentRecordingId = null;
        this.createInFlight = false;
        this.recordingRetryDelayMs = 700;
    }
    setMeetingContext(groupId, meetingId) {
        this.groupId = groupId;
        this.meetingId = meetingId;
    }
    clearMeetingContext() {
        this.groupId = null;
        this.meetingId = null;
    }
    reset() {
        this.recording = false;
        this.currentRecordingId = null;
        this.createInFlight = false;
        this.deps.bus.emit("recording-changed", false);
    }
    isRecording() {
        return this.recording;
    }
    async start(source, renderedParticipantCount) {
        if (!this.deps.canRecord()) {
            Logger.user("Recording blocked for user_type=customer");
            return;
        }
        const requiredParticipants = APP_CONFIG.recording.autoStartParticipantThreshold;
        if (renderedParticipantCount !== requiredParticipants) {
            Logger.setStatus("Recording requires both participants on live video.");
            Logger.user(`Recording blocked: rendered participants=${renderedParticipantCount}, required=${requiredParticipants}`);
            return;
        }
        if (this.recording || this.createInFlight)
            return;
        const groupId = this.groupId;
        const meetingId = this.meetingId;
        if (!Number.isFinite(groupId) || !Number.isFinite(meetingId)) {
            Logger.error(ErrorMessages.RMS_RECORDING_CREATE_FAILED, { groupId, meetingId });
            Logger.setStatus(ErrorMessages.RMS_RECORDING_CREATE_FAILED);
            return;
        }
        this.createInFlight = true;
        try {
            const server = this.deps.getServer();
            const http = new HttpClient(server.server, server.client_id);
            const rms = new RmsClient(http);
            const recordingId = await rms.createRecording(groupId, meetingId);
            Logger.user(`[rms] recording created groupId=${groupId} meetingId=${meetingId} recordingId=${recordingId}`);
            Logger.user(`${source} start recording`);
            this.enableRecording(recordingId, 1);
        }
        catch (e) {
            Logger.error(ErrorMessages.RMS_RECORDING_CREATE_FAILED, e);
            Logger.setStatus(ErrorMessages.RMS_RECORDING_CREATE_FAILED);
        }
        finally {
            this.createInFlight = false;
        }
    }
    stop(source) {
        if (!this.recording)
            return;
        Logger.user(`${source} stop recording`);
        this.disableRecording(1);
    }
    stopOnLeave() {
        const plugin = this.deps.getPlugin();
        if (this.recording && plugin) {
            try {
                plugin.send({
                    message: {
                        request: "enable_recording",
                        record: false,
                        room: this.deps.getCurrentRoomId()
                    }
                });
            }
            catch (e) {
                Logger.error(ErrorMessages.CALL_RECORDING_STOP_ON_LEAVE_FAILED, e);
            }
        }
        this.recording = false;
        this.currentRecordingId = null;
        this.deps.bus.emit("recording-changed", false);
    }
    endCallOnRecordingFailure(message, err) {
        Logger.error(ErrorMessages.callRecordingLog(message), err);
        Logger.setStatus(ErrorMessages.CALL_RECORDING_FAILED_ENDING);
        this.recording = false;
        this.currentRecordingId = null;
        this.deps.bus.emit("recording-changed", false);
        if (!this.deps.isLeaving())
            this.deps.leave();
    }
    enableRecording(recordingId, attempt) {
        const plugin = this.deps.getPlugin();
        if (!plugin || !this.deps.getJoinedRoom())
            return;
        if (this.recording)
            return;
        this.currentRecordingId = recordingId;
        plugin.send({
            message: {
                request: "enable_recording",
                record: true,
                room: this.deps.getCurrentRoomId(),
                recordingId,
                participantId: this.deps.getParticipantId()
            },
            success: () => {
                this.recording = true;
                Logger.setStatus(ErrorMessages.callRecordingStarted(String(recordingId)));
                this.deps.bus.emit("recording-changed", true);
            },
            error: (e) => {
                Logger.error(ErrorMessages.callRecordingStartFailed(attempt), e);
                this.recording = false;
                this.deps.bus.emit("recording-changed", false);
                if (attempt < 2) {
                    Logger.setStatus(ErrorMessages.CALL_RECORDING_START_RETRYING);
                    window.setTimeout(() => this.enableRecording(recordingId, attempt + 1), this.recordingRetryDelayMs);
                    return;
                }
                this.endCallOnRecordingFailure("start failed after retry", e);
            }
        });
    }
    disableRecording(attempt) {
        const plugin = this.deps.getPlugin();
        if (!plugin || !this.recording)
            return;
        plugin.send({
            message: {
                request: "enable_recording",
                record: false,
                room: this.deps.getCurrentRoomId()
            },
            success: () => {
                this.recording = false;
                this.currentRecordingId = null;
                Logger.setStatus(ErrorMessages.CALL_RECORDING_STOPPED);
                this.deps.bus.emit("recording-changed", false);
            },
            error: (e) => {
                Logger.error(ErrorMessages.callRecordingStopFailed(attempt), e);
                if (attempt < 2) {
                    Logger.setStatus(ErrorMessages.CALL_RECORDING_STOP_RETRYING);
                    window.setTimeout(() => this.disableRecording(attempt + 1), this.recordingRetryDelayMs);
                    return;
                }
                this.endCallOnRecordingFailure("stop failed after retry", e);
            }
        });
    }
}
// import { HttpClient } from "../core/http/HttpClient";
// import { ImsClient } from "../core/clients/ims/ImsClient";
class CallController {
    constructor(bus, localVideo, remoteVideo) {
        this.bus = bus;
        this.localVideo = localVideo;
        this.remoteVideo = remoteVideo;
        this.roster = new ParticipantRoster();
        this.plugin = null;
        this.privateId = null;
        this.selfId = null;
        this.remoteFeeds = null;
        this.joinedRoom = false;
        this.roomCreateAttempted = false;
        this.cameraStream = null;
        this.screenEnabled = false;
        this.vbEnabled = false;
        this.screenManager = new ScreenShareManager();
        this.currentRoomId = null;
        this.participantSyncTimer = null;
        this.participantSyncInFlight = false;
        this.lastParticipantSyncAt = 0;
        this.activeJoinCfg = null;
        this.retryTimer = null;
        this.serverRetryAttempt = 0;
        this.peerRetryAttempt = 0;
        this.isLeaving = false;
        this.suppressPublisherCleanupRetry = false;
        this.suppressRemoteFeedRetry = false;
        this.participantSyncRequestTimer = null;
        this.participantSyncRequestSeq = 0;
        this.cameraStreamOrientation = null;
        this.publisherPc = null;
        this.subscriberPcs = new Map();
        this.localAudioEnabled = true;
        this.localVideoEnabled = true;
        this.audioToggleBusy = false;
        this.videoToggleBusy = false;
        this.screenToggleBusy = false;
        this.vbToggleBusy = false;
        this.peerTelemetryByFeed = new Map();
        this.peerNetworkTelemetryByFeed = new Map();
        this.mixedAudioContext = null;
        this.mixedAudioTrack = null;
        this.callId = null;
        this.userType = this.resolveUserType();
        this.cameraProfileKey = "";
        this.suppressSessionDestroyedRetryUntil = 0;
        this.lastPublisherTransportErrorReason = null;
        this.lastPublisherTransportErrorAt = 0;
        this.gateway = new JanusGateway();
        this.media = new MediaManager();
        this.vbManager = new VirtualBackgroundManager();
        this.vbManager.setSourceProvider(async () => {
            try {
                return await this.ensureCameraStream();
            }
            catch {
                return null;
            }
        });
        this.connectionEngine = new ConnectionStatusEngine((status) => {
            this.bus.emit("connection-status", status);
        });
        this.adaptiveNetwork = new AdaptiveNetworkManager(this.userType, {
            onRiskSignal: (signal) => {
                this.bus.emit("network-risk", signal);
            },
            onModeChanged: async (_mode, videoCfg) => {
                await this.applyAdaptiveVideoConfig(videoCfg);
            }
        });
        this.recordingController = new RecordingController({
            bus: this.bus,
            getPlugin: () => this.plugin,
            getJoinedRoom: () => this.joinedRoom,
            getCurrentRoomId: () => this.currentRoomId,
            getParticipantId: () => this.activeJoinCfg?.participantId,
            getServer: () => UrlConfig.getVcxServer(),
            isLeaving: () => this.isLeaving,
            leave: () => this.leave(),
            canRecord: () => this.userType === "agent"
        });
        this.bus.emit("connection-status", this.connectionEngine.getStatus());
        this.gateway.init();
        this.monitoringStat = new CallMonitoringStat(this.bus, this.remoteVideo, {
            getJoinedRoom: () => this.joinedRoom,
            getPublisherPc: () => this.publisherPc,
            getSubscriberPcs: () => Array.from(this.subscriberPcs.values()),
            getRemoteParticipantCount: () => {
                return this.roster.snapshot(this.currentRoomId ?? 0).participantIds
                    .filter((id) => id !== this.selfId)
                    .length;
            },
            getPreferredAudioTrack: () => this.getPreferredAudioTrack(),
            isLocalAudioMuted: () => {
                return !this.localAudioEnabled;
            },
            getPeerTelemetry: (now) => this.pickFreshPeerTelemetry(now),
            emitPeerTelemetry: (payload) => this.sendPeerTelemetry(payload),
            emitPeerNetworkTelemetry: (payload) => this.sendPeerTelemetry(payload)
        });
    }
    resolveUserType() {
        const qs = new URLSearchParams(window.location.search);
        const raw = qs.get("user_type") ??
            qs.get("usertpye") ??
            qs.get("usertype") ??
            "";
        return raw.trim().toLowerCase() === "agent" ? "agent" : "customer";
    }
    async join(cfg, opts) {
        if (!opts?.internalRetry || !this.callId) {
            this.callId = Correlation.newId();
        }
        this.activeJoinCfg = cfg;
        this.isLeaving = false;
        this.localAudioEnabled = true;
        this.localVideoEnabled = true;
        this.suppressPublisherCleanupRetry = false;
        this.adaptiveNetwork.resetForJoin();
        this.lastPublisherTransportErrorReason = null;
        this.lastPublisherTransportErrorAt = 0;
        if (!opts?.internalRetry) {
            this.serverRetryAttempt = 0;
            this.peerRetryAttempt = 0;
            this.clearRetryTimer();
        }
        Logger.user(`[call] join start callId=${this.callId} roomId=${cfg.roomId} participantId=${cfg.participantId ?? "n/a"}`);
        this.bus.emit("telemetry-context", {
            callId: this.callId,
            roomId: cfg.roomId,
            participantId: cfg.participantId ?? null
        });
        this.connectionEngine.onJoinStarted();
        try {
            const server = UrlConfig.getVcxServer().server;
            const clientId = UrlConfig.getVcxServer().client_id;
            const http = new HttpClient(server, clientId);
            const ims = new ImsClient(http);
            const payload = await ims.getMediaConstraints();
            this.adaptiveNetwork.resetForJoin(payload);
            this.gateway.createSession(cfg.server, payload.PC_CONFIG?.iceServers, () => {
                this.connectionEngine.onSessionReady();
                this.attachAndEnsureRoomThenJoin(cfg);
            }, () => {
                this.connectionEngine.onSessionDestroyed();
                if (this.isLeaving || Date.now() < this.suppressSessionDestroyedRetryUntil) {
                    Logger.user("[call] Janus session destroyed after controlled teardown; retry skipped.");
                    return;
                }
                this.scheduleServerRetry("Janus session destroyed");
            }, (e) => {
                this.scheduleServerRetry(`Janus session create failed: ${JSON.stringify(e)}`);
            });
        }
        catch (e) {
            const requestId = String(e?.requestId || "n/a");
            Logger.error(ErrorMessages.callJoinFailed(this.callId ?? "n/a", cfg.roomId, requestId), e);
            this.scheduleServerRetry(ErrorMessages.callJoinError(e?.message || e));
        }
    }
    clearRetryTimer() {
        if (this.retryTimer !== null) {
            window.clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }
    clearParticipantSyncRequestTimer() {
        if (this.participantSyncRequestTimer !== null) {
            window.clearTimeout(this.participantSyncRequestTimer);
            this.participantSyncRequestTimer = null;
        }
    }
    destroyGatewayControlled() {
        this.suppressSessionDestroyedRetryUntil = Date.now() + 5000;
        this.gateway.destroy();
    }
    cleanupForRetry() {
        this.suppressRemoteFeedRetry = true;
        this.stopAdaptiveNetworkMonitor();
        this.stopMediaStatsLoop();
        this.clearMixedAudioResources();
        this.vbManager.disable();
        this.vbEnabled = false;
        this.screenManager.stop();
        this.screenEnabled = false;
        this.peerTelemetryByFeed.clear();
        this.peerNetworkTelemetryByFeed.clear();
        this.remoteFeeds?.cleanupAll();
        this.remoteFeeds = null;
        this.plugin = null;
        this.stopParticipantSync();
        this.joinedRoom = false;
        this.roomCreateAttempted = false;
        this.privateId = null;
        this.selfId = null;
        this.publisherPc = null;
        this.subscriberPcs.clear();
        this.lastPublisherTransportErrorReason = null;
        this.lastPublisherTransportErrorAt = 0;
        this.localAudioEnabled = true;
        this.localVideoEnabled = true;
        this.audioToggleBusy = false;
        this.videoToggleBusy = false;
        this.screenToggleBusy = false;
        this.vbToggleBusy = false;
        this.currentRoomId = null;
        this.roster.reset();
        this.recordingController.reset();
        this.bus.emit("joined", false);
        this.bus.emit("mute-changed", false);
        this.suppressPublisherCleanupRetry = true;
        this.destroyGatewayControlled();
    }
    scheduleServerRetry(reason) {
        this.scheduleRetry("server", reason);
    }
    schedulePeerRetry(reason) {
        this.scheduleRetry("peer", reason);
    }
    scheduleRetry(kind, reason) {
        if (this.isLeaving)
            return;
        const cfg = this.activeJoinCfg;
        if (!cfg)
            return;
        if (this.retryTimer !== null)
            return;
        const maxAttempts = kind === "server"
            ? APP_CONFIG.call.retry.serverMaxAttempts
            : APP_CONFIG.call.retry.peerMaxAttempts;
        const delayMs = kind === "server"
            ? APP_CONFIG.call.retry.serverDelayMs
            : APP_CONFIG.call.retry.peerDelayMs;
        const attempt = kind === "server"
            ? ++this.serverRetryAttempt
            : ++this.peerRetryAttempt;
        if (kind === "server") {
            this.peerRetryAttempt = 0;
        }
        else {
            this.serverRetryAttempt = 0;
        }
        if (attempt > maxAttempts) {
            this.logFinalFailure(kind, reason);
            this.connectionEngine.onFailed(reason);
            Logger.setStatus(ErrorMessages.callRetryLimitStatus(kind));
            Logger.error(ErrorMessages.callRetryExhausted(kind, this.callId ?? "n/a", cfg.roomId, reason));
            return;
        }
        if (kind === "server") {
            this.connectionEngine.onServerRetrying(attempt, maxAttempts, reason);
            Logger.setStatus(ErrorMessages.callServerRetrying(attempt, maxAttempts));
        }
        else {
            this.connectionEngine.onPeerRetrying(attempt, maxAttempts, reason);
            Logger.setStatus(ErrorMessages.callPeerRetrying(attempt, maxAttempts));
        }
        Logger.warn(ErrorMessages.callRetryScheduled(kind, attempt, maxAttempts, this.callId ?? "n/a", cfg.roomId, reason));
        this.cleanupForRetry();
        this.retryTimer = window.setTimeout(() => {
            this.retryTimer = null;
            this.join(cfg, { internalRetry: true });
        }, delayMs);
    }
    attachAndEnsureRoomThenJoin(cfg) {
        this.gateway.attachPublisher((h) => {
            this.plugin = h;
            this.joinedRoom = false;
            this.roomCreateAttempted = false;
            this.selfId = null;
            this.publisherPc = null;
            this.subscriberPcs.clear();
            this.roster.reset();
            this.stopParticipantSync();
            this.recordingController.reset();
            this.connectionEngine.onPublisherAttached();
            Logger.setStatus(ErrorMessages.CALL_PLUGIN_ATTACHED_CHECKING_ROOM);
            this.ensureRoomThenJoin(cfg);
        }, (msg, jsep) => this.onPublisherMessage(cfg, msg, jsep), (track, on) => {
            if (track && typeof track.kind === "string") {
                this.connectionEngine.onLocalTrackSignal(track, !!on);
            }
        }, () => {
            if (this.isLeaving || this.suppressPublisherCleanupRetry)
                return;
            this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts, "Publisher cleanup");
            Logger.setStatus(ErrorMessages.CALL_PUBLISHER_CLEANUP_RECOVERING);
            this.schedulePeerRetry("Publisher cleanup");
        }, (e) => {
            this.scheduleServerRetry(`Attach publisher failed: ${JSON.stringify(e)}`);
        }, (payload) => {
            this.bus.emit("janus-slowlink", {
                participantId: this.selfId,
                feedId: null,
                source: "publisher",
                direction: payload.uplink ? "uplink" : "downlink",
                lost: payload.lost,
                mid: payload.mid,
                at: Date.now()
            });
        });
    }
    getVideoRoomData(msg) {
        return msg?.plugindata?.data ?? msg;
    }
    ensureRoomThenJoin(cfg) {
        if (!this.plugin)
            return;
        this.plugin.send({
            message: { request: "exists", room: cfg.roomId },
            success: (res) => {
                const data = this.getVideoRoomData(res);
                const exists = !!data?.exists;
                if (exists) {
                    Logger.setStatus(ErrorMessages.CALL_ROOM_EXISTS_JOINING);
                    this.sendPublisherJoin(cfg);
                }
                else {
                    Logger.setStatus(ErrorMessages.CALL_ROOM_NOT_FOUND_CREATING);
                    this.roomCreateAttempted = true;
                    this.sendCreateRoom(cfg);
                }
            },
            error: () => {
                this.scheduleServerRetry("Room exists check failed");
            }
        });
    }
    sendPublisherJoin(cfg) {
        if (!this.plugin)
            return;
        const message = {
            request: "join",
            room: cfg.roomId,
            ptype: "publisher",
            display: cfg.display
        };
        if (typeof cfg.participantId === "number" && Number.isFinite(cfg.participantId)) {
            message.id = cfg.participantId;
        }
        this.plugin.send({
            message
        });
    }
    sendCreateRoom(cfg) {
        if (!this.plugin)
            return;
        this.plugin.send({
            message: {
                request: "create",
                room: cfg.roomId,
                publishers: APP_CONFIG.videoroom.maxPublishers,
                description: `Room ${cfg.roomId}`,
                videocodec: CodecSupportUtil.getRoomVideoCodecList()
            },
            success: () => {
                Logger.setStatus(ErrorMessages.CALL_ROOM_CREATED_JOINING);
                this.sendPublisherJoin(cfg);
            },
            error: () => {
                this.scheduleServerRetry("Create room failed");
            }
        });
    }
    handlePublisherJoinError(cfg, data, errorCodeRaw) {
        const errorCode = JoinErrorUtils.parseErrorCode(errorCodeRaw);
        const errorText = JoinErrorUtils.extractErrorText(data);
        if (errorCode === ErrorCodes.JANUS_ROOM_NOT_FOUND) {
            if (!this.roomCreateAttempted) {
                this.roomCreateAttempted = true;
                this.sendCreateRoom(cfg);
            }
            else {
                this.scheduleServerRetry(ErrorMessages.callRoomJoinFailedAfterCreateAttempt(String(ErrorCodes.JANUS_ROOM_NOT_FOUND)));
            }
            return true;
        }
        if (JoinErrorUtils.isParticipantIdCollisionError(errorCode, errorText)) {
            const msg = ErrorMessages.CALL_PARTICIPANT_ID_IN_USE;
            Logger.error(ErrorMessages.callParticipantIdCollision(this.callId ?? "n/a", cfg.roomId, String(cfg.participantId ?? "n/a"), String(errorCode ?? "n/a"), errorText));
            Logger.setStatus(msg);
            this.connectionEngine.setFatalError(msg, ErrorMessages.CALL_PARTICIPANT_ID_IN_USE_SECONDARY);
            this.bus.emit("joined", false);
            return true;
        }
        const unauthorized = JoinErrorUtils.isUnauthorizedJoinError(errorCode, errorText);
        if (unauthorized) {
            const msg = ErrorMessages.CALL_AUTHORIZATION_FAILED;
            Logger.error(ErrorMessages.callUnauthorizedJoin(this.callId ?? "n/a", cfg.roomId, String(errorCode ?? "n/a"), errorText));
            Logger.setStatus(msg);
            this.connectionEngine.setFatalError(msg, ErrorMessages.CALL_AUTHORIZATION_FAILED_SECONDARY);
            this.bus.emit("joined", false);
            return true;
        }
        const roomMissing = JoinErrorUtils.isRoomMissingError(errorText);
        if (roomMissing) {
            if (!this.roomCreateAttempted) {
                this.roomCreateAttempted = true;
                this.sendCreateRoom(cfg);
            }
            else {
                this.scheduleServerRetry(ErrorMessages.callRoomMissingAfterCreate(String(errorCode ?? "n/a")));
            }
            return true;
        }
        this.scheduleServerRetry(ErrorMessages.callPublisherJoinError(String(errorCode ?? "n/a"), errorText || JSON.stringify(data)));
        return true;
    }
    onPublisherMessage(cfg, msg, jsep) {
        if (msg?.janus === "hangup") {
            const reason = String(msg?.reason || "Peer hangup");
            Logger.user(`[transport-info] ${ErrorMessages.callPublisherHangup(reason)}`);
            if (this.isPeerTransportFailureText(reason)) {
                const failureReason = this.buildPeerFailureReason(`Publisher hangup: ${reason}`, this.publisherPc);
                this.rememberPublisherTransportError(failureReason);
                this.schedulePeerRetry(failureReason);
            }
            return;
        }
        const data = this.getVideoRoomData(msg);
        const event = data["videoroom"];
        const errorCode = data["error_code"];
        if (data?.error || errorCode) {
            Logger.user(`[transport-info] ${ErrorMessages.callPublisherPluginError(data)}`);
            if (!this.joinedRoom && this.handlePublisherJoinError(cfg, data, errorCode)) {
                return;
            }
            if (this.joinedRoom) {
                const runtimeIssue = this.classifyPublisherRuntimeIssue(data);
                if (runtimeIssue.kind === "peer") {
                    this.rememberPublisherTransportError(runtimeIssue.reason);
                    this.schedulePeerRetry(runtimeIssue.reason);
                }
                else {
                    this.scheduleServerRetry(runtimeIssue.reason);
                }
                return;
            }
        }
        if (event === "joined") {
            this.joinedRoom = true;
            this.currentRoomId = cfg.roomId;
            this.serverRetryAttempt = 0;
            this.peerRetryAttempt = 0;
            this.clearRetryTimer();
            this.suppressRemoteFeedRetry = false;
            this.connectionEngine.onJoinedRoom();
            const myId = data["id"];
            this.privateId = data["private_id"];
            this.selfId = myId;
            this.roster.setSelf(myId);
            Logger.setStatus(ErrorMessages.CALL_JOINED_PUBLISHING);
            this.remoteFeeds = new RemoteFeedManager(this.gateway.getJanus(), cfg.roomId, this.privateId, this.gateway.getOpaqueId(), this.media, this.remoteVideo, {
                onSubscriberPcReady: (feedId, pc) => {
                    this.subscriberPcs.set(feedId, pc);
                    this.connectionEngine.registerSubscriberPc(feedId, pc);
                },
                onRemoteTrackSignal: (feedId, track, on) => {
                    this.connectionEngine.onRemoteTrackSignal(feedId, track, on);
                },
                onRemoteTelemetry: (feedId, payload) => {
                    this.peerTelemetryByFeed.set(feedId, payload);
                },
                onRemoteNetworkTelemetry: (feedId, payload) => {
                    this.peerNetworkTelemetryByFeed.set(feedId, payload);
                    this.bus.emit("peer-network-telemetry", { feedId, payload });
                },
                onSlowLink: (feedId, payload) => {
                    this.bus.emit("janus-slowlink", {
                        participantId: feedId,
                        feedId,
                        source: "subscriber",
                        direction: payload.uplink ? "uplink" : "downlink",
                        lost: payload.lost,
                        mid: payload.mid,
                        at: Date.now()
                    });
                },
                onRemoteFeedCleanup: (feedId) => {
                    this.subscriberPcs.delete(feedId);
                    this.peerTelemetryByFeed.delete(feedId);
                    this.peerNetworkTelemetryByFeed.delete(feedId);
                    this.connectionEngine.unregisterSubscriber(feedId);
                    if (this.isLeaving || this.suppressRemoteFeedRetry) {
                        Logger.warn(`Remote feed ${feedId} cleanup ignored (controlled cleanup)`);
                        return;
                    }
                    if (this.remoteFeeds && this.roster.has(feedId) && feedId !== this.selfId) {
                        Logger.warn(`Remote feed ${feedId} cleaned up. Scheduling re-subscribe.`);
                        window.setTimeout(() => {
                            this.remoteFeeds?.addFeed(feedId);
                        }, APP_CONFIG.call.remoteFeedRetryDelayMs);
                    }
                },
                onRemoteFeedRetryExhausted: (feedId, attempts) => {
                    this.subscriberPcs.delete(feedId);
                    this.connectionEngine.onRemoteFeedRetryExhausted(feedId, attempts);
                    Logger.setStatus(ErrorMessages.CALL_REMOTE_VIDEO_UNSTABLE);
                    Logger.error(ErrorMessages.callRemoteFeedRetryExhausted(this.callId ?? "n/a", cfg.roomId, feedId, attempts));
                }
            });
            this.publish();
            this.reconcile(cfg, data["publishers"]);
            this.bus.emit("joined", true);
            this.bus.emit("video-mute-changed", !this.localVideoEnabled);
            this.startParticipantSync(cfg);
            this.startMediaStatsLoop();
        }
        if (event === "event") {
            this.reconcile(cfg, data["publishers"]);
            const leaving = data["leaving"];
            if (typeof leaving === "number") {
                this.removeParticipant(cfg, leaving);
            }
            const unpublished = data["unpublished"];
            if (typeof unpublished === "number") {
                this.removeParticipant(cfg, unpublished);
            }
            this.syncParticipantsFromServer(cfg);
        }
        if (event === "destroyed") {
            this.scheduleServerRetry("Video room destroyed event");
            return;
        }
        if (jsep)
            this.plugin.handleRemoteJsep({ jsep });
    }
    reconcile(cfg, publishers) {
        if (!publishers)
            return;
        publishers.forEach((p) => {
            const feedId = Number(p?.id);
            if (!Number.isFinite(feedId))
                return;
            this.roster.add(feedId);
            if (this.remoteFeeds && feedId !== this.selfId) {
                this.connectionEngine.onSubscriberRequested();
                this.remoteFeeds.addFeed(feedId);
            }
        });
        this.publishParticipants(cfg);
    }
    publishParticipants(cfg) {
        const snapshot = this.roster.snapshot(cfg.roomId);
        this.bus.emit("participants", snapshot);
        const remoteCount = snapshot.participantIds
            .filter((id) => id !== this.selfId)
            .length;
        this.connectionEngine.setRemoteParticipantCount(remoteCount);
    }
    startParticipantSync(cfg) {
        this.stopParticipantSync();
        this.syncParticipantsFromServer(cfg);
        const intervalMs = this.getParticipantSyncIntervalMs();
        this.participantSyncTimer = window.setInterval(() => {
            this.syncParticipantsFromServer(cfg);
        }, intervalMs);
    }
    getParticipantSyncIntervalMs() {
        return this.adaptiveNetwork.getParticipantSyncIntervalMs();
    }
    stopParticipantSync() {
        if (this.participantSyncTimer !== null) {
            window.clearInterval(this.participantSyncTimer);
            this.participantSyncTimer = null;
        }
        this.clearParticipantSyncRequestTimer();
        this.participantSyncRequestSeq = 0;
        this.participantSyncInFlight = false;
        this.lastParticipantSyncAt = 0;
    }
    syncParticipantsFromServer(cfg) {
        if (!this.plugin || !this.joinedRoom)
            return;
        if (this.participantSyncInFlight)
            return;
        const now = Date.now();
        if (now - this.lastParticipantSyncAt < APP_CONFIG.call.participantSyncCooldownMs)
            return;
        this.lastParticipantSyncAt = now;
        this.participantSyncInFlight = true;
        const requestSeq = ++this.participantSyncRequestSeq;
        this.clearParticipantSyncRequestTimer();
        this.participantSyncRequestTimer = window.setTimeout(() => {
            if (!this.participantSyncInFlight || requestSeq !== this.participantSyncRequestSeq)
                return;
            this.participantSyncInFlight = false;
            this.participantSyncRequestTimer = null;
            Logger.error(ErrorMessages.callListParticipantsTimeout(requestSeq, cfg.roomId));
        }, APP_CONFIG.call.participantSyncRequestTimeoutMs);
        this.plugin.send({
            message: { request: "listparticipants", room: cfg.roomId },
            success: (res) => {
                if (requestSeq !== this.participantSyncRequestSeq)
                    return;
                this.clearParticipantSyncRequestTimer();
                const data = this.getVideoRoomData(res);
                const participants = Array.isArray(data?.participants) ? data.participants : [];
                const serverIds = new Set();
                participants.forEach((p) => {
                    const feedId = Number(p?.id);
                    if (!Number.isFinite(feedId))
                        return;
                    serverIds.add(feedId);
                    this.roster.add(feedId);
                    if (this.remoteFeeds && feedId !== this.selfId) {
                        this.remoteFeeds.addFeed(feedId);
                    }
                });
                const localIds = this.roster.snapshot(cfg.roomId).participantIds;
                localIds.forEach((id) => {
                    if (id === this.selfId)
                        return;
                    if (!serverIds.has(id)) {
                        this.roster.remove(id);
                        this.remoteFeeds?.removeFeed(id);
                    }
                });
                this.publishParticipants(cfg);
                this.participantSyncInFlight = false;
            },
            error: (e) => {
                if (requestSeq !== this.participantSyncRequestSeq)
                    return;
                this.clearParticipantSyncRequestTimer();
                this.participantSyncInFlight = false;
                Logger.error(ErrorMessages.callListParticipantsError(requestSeq, e));
            }
        });
    }
    removeParticipant(cfg, feedId) {
        if (feedId === this.selfId)
            return;
        this.roster.remove(feedId);
        this.subscriberPcs.delete(feedId);
        this.peerTelemetryByFeed.delete(feedId);
        this.peerNetworkTelemetryByFeed.delete(feedId);
        this.remoteFeeds?.removeFeed(feedId);
        this.publishParticipants(cfg);
    }
    // =====================================
    // MEDIA
    // =====================================
    getVideoConfig() {
        return this.adaptiveNetwork.getVideoConfig();
    }
    getCurrentCameraProfileKey() {
        return this.adaptiveNetwork.getCameraProfileKey();
    }
    buildVideoConstraintsForCurrentProfile(orientation) {
        return this.adaptiveNetwork.buildCameraConstraints(orientation, this.isIOSDevice());
    }
    tuneVideoSenderBitrate(pc, bitrateBps, maxFramerate) {
        try {
            const sender = pc.getSenders().find(s => s.track?.kind === "video");
            if (!sender || typeof sender.getParameters !== "function" || typeof sender.setParameters !== "function")
                return;
            const p = sender.getParameters();
            const encodings = (p.encodings && p.encodings.length > 0) ? p.encodings : [{}];
            encodings[0].maxBitrate = bitrateBps;
            encodings[0].maxFramerate = maxFramerate;
            p.encodings = encodings;
            sender.setParameters(p).catch((e) => {
                Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_ERROR, e);
            });
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_HOOK_ERROR, e);
        }
    }
    startAdaptiveNetworkMonitor(pc) {
        this.adaptiveNetwork.start(pc);
    }
    stopAdaptiveNetworkMonitor() {
        this.adaptiveNetwork.stop();
    }
    async applyAdaptiveVideoConfig(videoCfg) {
        try {
            if (this.publisherPc) {
                this.tuneVideoSenderBitrate(this.publisherPc, videoCfg.bitrate_bps, videoCfg.max_framerate);
            }
            try {
                this.plugin?.send({
                    message: {
                        request: "configure",
                        audio: this.localAudioEnabled,
                        video: this.localVideoEnabled,
                        bitrate: videoCfg.bitrate_bps,
                        bitrate_cap: videoCfg.bitrate_cap
                    }
                });
            }
            catch (e) {
                Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_ERROR, e);
            }
            if (this.activeJoinCfg && this.joinedRoom) {
                this.startParticipantSync(this.activeJoinCfg);
            }
            if (!this.screenEnabled && !this.vbEnabled && this.plugin) {
                const cam = await this.ensureCameraStream();
                const track = cam.getVideoTracks()[0];
                if (track) {
                    track.enabled = this.localVideoEnabled;
                    this.replaceVideoTrack(track);
                }
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_MEDIA_SETUP_SET_PARAMETERS_HOOK_ERROR, e);
        }
    }
    isIOSDevice() {
        const ua = navigator.userAgent || "";
        const isiPhoneFamily = /iPad|iPhone|iPod/i.test(ua);
        const iPadOSDesktopUA = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
        return isiPhoneFamily || iPadOSDesktopUA;
    }
    getViewportOrientation() {
        return window.innerHeight >= window.innerWidth ? "portrait" : "landscape";
    }
    async getPublishTracks() {
        const stream = await this.ensureCameraStream();
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        if (!audioTrack || !videoTrack) {
            throw new Error(ErrorMessages.CALL_CAMERA_MIC_TRACK_UNAVAILABLE);
        }
        // Ensure local preview and connectivity state are updated even when
        // browser/Janus onlocaltrack callback is delayed or missing.
        this.connectionEngine.onLocalTrackSignal(videoTrack, true);
        this.media.setLocalTrack(this.localVideo, videoTrack);
        const tracks = [
            { type: "audio", capture: audioTrack, recv: false },
            { type: "video", capture: videoTrack, recv: false }
        ];
        if (APP_CONFIG.mediaTelemetry.enablePeerTelemetry) {
            tracks.push({ type: "data" });
        }
        return tracks;
    }
    // public publish() {
    //   this.plugin.createOffer({
    //     tracks: [
    //       { type: "audio", capture: true, recv: false },
    //       { type: "video", capture: true, recv: false }
    //     ],
    //     success: (jsep: any) => {
    //       this.plugin.send({
    //         message: { request: "configure", audio: true, video: true },
    //         jsep
    //       });
    //     }
    //   });
    // }
    async publish() {
        if (!this.plugin) {
            Logger.setStatus(ErrorMessages.CALL_PUBLISH_IGNORED_PLUGIN_NOT_READY);
            return;
        }
        const videoCfg = this.getVideoConfig();
        let tracks;
        try {
            tracks = await this.getPublishTracks();
        }
        catch (e) {
            const classified = MediaErrorUtils.classifyPublishError(e);
            Logger.setStatus(classified.userMessage);
            Logger.error(classified.userMessage, e);
            this.connectionEngine.setFatalError(classified.userMessage, ErrorMessages.CALL_FIX_CAMERA_MIC_AND_RECONNECT);
            return;
        }
        const codecOrder = CodecSupportUtil.getPublishCodecAttemptOrder();
        this.attemptPublishWithCodec(tracks, videoCfg, codecOrder, 0);
    }
    attemptPublishWithCodec(tracks, videoCfg, codecOrder, attemptIndex) {
        if (!this.plugin)
            return;
        const codec = codecOrder[attemptIndex];
        if (!codec) {
            this.handlePublishFailure(new Error("No publish codec available"));
            return;
        }
        Logger.user(`[publish] createOffer videocodec=${codec} attempt=${attemptIndex + 1}/${codecOrder.length}`);
        this.plugin.createOffer({
            tracks,
            success: (jsep) => {
                this.bindPublisherConnectivity(videoCfg);
                this.plugin.send({
                    message: {
                        request: "configure",
                        audio: true,
                        video: true,
                        data: APP_CONFIG.mediaTelemetry.enablePeerTelemetry,
                        bitrate: videoCfg.bitrate_bps,
                        bitrate_cap: videoCfg.bitrate_cap,
                        videocodec: codec
                    },
                    jsep,
                    success: (res) => {
                        const data = this.getVideoRoomData(res);
                        if (data?.error || data?.error_code) {
                            this.fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, data);
                        }
                    },
                    error: (e) => {
                        this.fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, e);
                    }
                });
            },
            error: (e) => {
                this.fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, e);
            }
        });
    }
    fallbackOrHandlePublishFailure(codecOrder, attemptIndex, tracks, videoCfg, error) {
        const canFallback = APP_CONFIG.media.enableVideoCodecFallback && (attemptIndex + 1) < codecOrder.length;
        if (canFallback) {
            const currentCodec = codecOrder[attemptIndex];
            const nextCodec = codecOrder[attemptIndex + 1];
            Logger.warn(`[publish] videocodec=${currentCodec} failed. Falling back to ${nextCodec}.`);
            this.attemptPublishWithCodec(tracks, videoCfg, codecOrder, attemptIndex + 1);
            return;
        }
        this.handlePublishFailure(error);
    }
    bindPublisherConnectivity(videoCfg) {
        // Capture and emit connectivity info from RTCPeerConnection.
        try {
            // TODO: If Janus internals change and webrtcStuff.pc is unavailable, bind the publisher PC from Janus plugin callbacks.
            const pc = this.plugin?.webrtcStuff?.pc;
            if (pc) {
                this.publisherPc = pc;
                this.connectionEngine.registerPublisherPc(pc);
                this.tuneVideoSenderBitrate(pc, videoCfg.bitrate_bps, videoCfg.max_framerate);
                this.startAdaptiveNetworkMonitor(pc);
                const emit = () => {
                    const payload = {
                        ice: pc.iceConnectionState,
                        signaling: pc.signalingState,
                        connection: pc.connectionState ?? "n/a",
                        gathering: pc.iceGatheringState,
                        ts: Date.now(),
                    };
                    console.log("VCX_CONNECTIVITY=", payload);
                    this.bus.emit("connectivity", payload);
                };
                // emit once immediately
                emit();
                pc.onicecandidateerror = (evt) => {
                    const parsed = this.parseIceCandidateError(evt);
                    this.rememberPublisherTransportError(parsed.reason, false, evt);
                };
                pc.oniceconnectionstatechange = () => {
                    console.log("VCX_ICE=" + pc.iceConnectionState);
                    emit();
                    if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
                        this.lastPublisherTransportErrorReason = null;
                        this.lastPublisherTransportErrorAt = 0;
                        return;
                    }
                    if (pc.iceConnectionState === "failed") {
                        const reason = this.buildPeerFailureReason("Publisher ICE state failed", pc);
                        this.rememberPublisherTransportError(reason);
                        this.schedulePeerRetry(reason);
                    }
                };
                pc.onsignalingstatechange = () => {
                    console.log("VCX_SIGNALING=" + pc.signalingState);
                    emit();
                };
                // connectionState exists on modern browsers; not always present everywhere
                pc.onconnectionstatechange = () => {
                    console.log("VCX_CONNECTION=" + (pc.connectionState ?? "n/a"));
                    emit();
                    const connectionState = String(pc.connectionState ?? "");
                    if (connectionState === "connected") {
                        this.lastPublisherTransportErrorReason = null;
                        this.lastPublisherTransportErrorAt = 0;
                        return;
                    }
                    if (connectionState === "failed") {
                        const dtlsHint = this.inferDtlsFailureHint(pc);
                        const trigger = dtlsHint
                            ? `Publisher connection state failed (${dtlsHint})`
                            : "Publisher connection state failed";
                        const reason = this.buildPeerFailureReason(trigger, pc);
                        this.rememberPublisherTransportError(reason);
                        this.schedulePeerRetry(reason);
                    }
                };
                pc.onicegatheringstatechange = () => {
                    console.log("VCX_GATHERING=" + pc.iceGatheringState);
                    emit();
                };
            }
            else {
                this.publisherPc = null;
                this.lastPublisherTransportErrorReason = null;
                this.lastPublisherTransportErrorAt = 0;
                this.stopAdaptiveNetworkMonitor();
                console.log("VCX_CONNECTIVITY=pc_not_available");
                this.bus.emit("connectivity", {
                    ice: "n/a",
                    signaling: "n/a",
                    connection: "n/a",
                    gathering: "n/a",
                    ts: Date.now(),
                });
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_CONNECTIVITY_HOOK_ERROR, e);
        }
    }
    normalizeFailureReason(reason) {
        const normalized = String(reason || "").replace(/\s+/g, " ").trim();
        if (!normalized)
            return "unknown failure";
        const maxLen = 240;
        if (normalized.length <= maxLen)
            return normalized;
        return `${normalized.slice(0, maxLen - 3)}...`;
    }
    rememberPublisherTransportError(reason, severe = false, rawErr) {
        const normalized = this.normalizeFailureReason(reason);
        this.lastPublisherTransportErrorReason = normalized;
        this.lastPublisherTransportErrorAt = Date.now();
        const tag = severe ? "VCX_TRANSPORT_ERROR" : "VCX_TRANSPORT_INFO";
        const tagStyle = severe
            ? "background:#991b1b;color:#ffffff;padding:2px 6px;font-weight:700;border-radius:3px"
            : "background:#1d4ed8;color:#ffffff;padding:2px 6px;font-weight:700;border-radius:3px";
        console.log(`%c${tag}%c ${normalized}`, tagStyle, "color:#111827;font-weight:600");
        if (rawErr) {
            if (severe) {
                console.error(rawErr);
            }
            else {
                console.log(rawErr);
            }
        }
        if (severe) {
            Logger.error(normalized);
        }
        else {
            Logger.user(`[transport-info] ${normalized}`);
        }
    }
    getRecentPublisherTransportHint() {
        if (!this.lastPublisherTransportErrorReason)
            return null;
        const ageMs = Date.now() - this.lastPublisherTransportErrorAt;
        if (ageMs > 30000)
            return null;
        return this.lastPublisherTransportErrorReason;
    }
    inferDtlsFailureHint(pc) {
        const sctpTransportState = String(pc?.sctp?.transport?.state || "").toLowerCase();
        if (sctpTransportState === "failed") {
            return "DTLS transport failed";
        }
        const senderTransportState = pc.getSenders()
            .map((s) => String(s?.transport?.state || "").toLowerCase())
            .find((state) => state.length > 0);
        if (senderTransportState === "failed") {
            return "DTLS sender transport failed";
        }
        const receiverTransportState = pc.getReceivers()
            .map((r) => String(r?.transport?.state || "").toLowerCase())
            .find((state) => state.length > 0);
        if (receiverTransportState === "failed") {
            return "DTLS receiver transport failed";
        }
        const connectionState = String(pc.connectionState ?? "");
        if (connectionState === "failed" &&
            (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed")) {
            return "DTLS/SRTP likely failed after ICE connected";
        }
        return null;
    }
    buildPeerFailureReason(trigger, pc) {
        const parts = [this.normalizeFailureReason(trigger)];
        if (!navigator.onLine) {
            parts.push("browser offline");
        }
        if (pc) {
            const connectionState = String(pc.connectionState ?? "n/a");
            parts.push(`ice=${pc.iceConnectionState}, connection=${connectionState}, signaling=${pc.signalingState}`);
            const dtlsHint = this.inferDtlsFailureHint(pc);
            if (dtlsHint) {
                parts.push(dtlsHint);
            }
        }
        const transportHint = this.getRecentPublisherTransportHint();
        if (transportHint && !trigger.includes(transportHint) && !trigger.includes("hint=")) {
            parts.push(`hint=${transportHint}`);
        }
        return this.normalizeFailureReason(parts.join(" | "));
    }
    logFinalFailure(kind, reason) {
        const normalized = this.normalizeFailureReason(reason);
        const tag = kind === "peer" ? "VCX_TRANSPORT_FINAL_ERROR" : "VCX_SERVER_FINAL_ERROR";
        const tagStyle = "background:#7f1d1d;color:#ffffff;padding:2px 6px;font-weight:700;border-radius:3px";
        console.log(`%c${tag}%c ${normalized}`, tagStyle, "color:#111827;font-weight:600");
    }
    parseIceCandidateError(evt) {
        const anyEvt = evt;
        const url = String(anyEvt?.url || "unknown");
        const lowerUrl = url.toLowerCase();
        const isTurn = lowerUrl.startsWith("turn:") || lowerUrl.startsWith("turns:");
        const codeRaw = Number(anyEvt?.errorCode);
        const code = Number.isFinite(codeRaw) ? codeRaw : NaN;
        const text = String(anyEvt?.errorText || "").trim();
        const lowerText = text.toLowerCase();
        let label = isTurn ? "TURN candidate negotiation error" : "ICE candidate negotiation error";
        let severe = false;
        if (code === 401 || code === 438 || lowerText.includes("unauth") || lowerText.includes("credential")) {
            label = "TURN authentication failed";
            severe = true;
        }
        else if (lowerUrl.startsWith("turns:") || lowerText.includes("tls")) {
            label = "TURN TLS connection failed";
            severe = true;
        }
        else if (lowerText.includes("dtls")) {
            label = "DTLS handshake failed";
            severe = true;
        }
        else if (code === 701 ||
            lowerText.includes("unreachable") ||
            lowerText.includes("timed out") ||
            lowerText.includes("timeout") ||
            lowerText.includes("host lookup")) {
            label = isTurn ? "TURN server unreachable" : "STUN/ICE server unreachable";
            severe = true;
        }
        const codeText = Number.isFinite(code) ? String(code) : "n/a";
        const detailText = text || "n/a";
        return {
            reason: this.normalizeFailureReason(`${label} (url=${url}, code=${codeText}, text=${detailText})`),
            severe
        };
    }
    isPeerTransportFailureText(reason) {
        const lower = reason.toLowerCase();
        return lower.includes("ice") ||
            lower.includes("turn") ||
            lower.includes("dtls") ||
            lower.includes("tls") ||
            lower.includes("webrtc") ||
            lower.includes("peer") ||
            lower.includes("srtp");
    }
    classifyPublisherRuntimeIssue(data) {
        const errorCodeRaw = Number(data?.error_code);
        const errorCode = Number.isFinite(errorCodeRaw) ? String(errorCodeRaw) : "n/a";
        const detail = this.normalizeFailureReason(JoinErrorUtils.extractErrorText(data) || JSON.stringify(data));
        if (this.isPeerTransportFailureText(detail)) {
            return {
                kind: "peer",
                reason: this.normalizeFailureReason(`Publisher runtime media error code=${errorCode} detail=${detail}`)
            };
        }
        return {
            kind: "server",
            reason: this.normalizeFailureReason(`Publisher runtime signaling error code=${errorCode} detail=${detail}`)
        };
    }
    handlePublishFailure(e) {
        const classified = MediaErrorUtils.classifyPublishError(e);
        console.error(ErrorMessages.CALL_OFFER_ERROR_CONSOLE_TAG, e);
        Logger.setStatus(classified.userMessage);
        Logger.error(classified.userMessage, e);
        if (!classified.retryable) {
            this.connectionEngine.setFatalError(classified.userMessage, ErrorMessages.CALL_FIX_CAMERA_MIC_AND_RECONNECT);
            return;
        }
        this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts, ErrorMessages.callOfferErrorReason(e));
        Logger.setStatus(ErrorMessages.CALL_OFFER_ERROR_RECOVERING);
        this.schedulePeerRetry(ErrorMessages.callOfferErrorReason(e));
    }
    toggleMute() {
        void this.setAudioEnabled(!this.localAudioEnabled);
    }
    async setAudioEnabled(enabled) {
        if (!this.plugin)
            return this.localAudioEnabled;
        if (this.audioToggleBusy)
            return this.localAudioEnabled;
        this.audioToggleBusy = true;
        try {
            const track = this.getPreferredAudioTrack();
            if (enabled) {
                if (track)
                    track.enabled = true;
                try {
                    if (typeof this.plugin.unmuteAudio === "function") {
                        this.plugin.unmuteAudio();
                    }
                    else {
                        this.plugin.send({ message: { request: "configure", audio: true } });
                    }
                }
                catch (e) {
                    Logger.error(ErrorMessages.CALL_AUDIO_UNMUTE_SIGNALING_FAILED, e);
                }
                this.localAudioEnabled = true;
            }
            else {
                if (track)
                    track.enabled = false;
                try {
                    if (typeof this.plugin.muteAudio === "function") {
                        this.plugin.muteAudio();
                    }
                    else {
                        this.plugin.send({ message: { request: "configure", audio: false } });
                    }
                }
                catch (e) {
                    Logger.error(ErrorMessages.CALL_AUDIO_MUTE_SIGNALING_FAILED, e);
                }
                this.localAudioEnabled = false;
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_AUDIO_TOGGLE_FAILED, e);
            Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
        }
        finally {
            this.audioToggleBusy = false;
            this.bus.emit("mute-changed", !this.localAudioEnabled);
        }
        return this.localAudioEnabled;
    }
    async setVideoEnabled(enabled) {
        if (!this.plugin)
            return this.localVideoEnabled;
        if (this.videoToggleBusy)
            return this.localVideoEnabled;
        this.videoToggleBusy = true;
        try {
            const activeVideoTrack = this.screenEnabled
                ? this.screenManager.getStream()?.getVideoTracks()[0]
                : this.vbEnabled
                    ? this.vbManager.getOutputStream()?.getVideoTracks()[0]
                    : this.cameraStream?.getVideoTracks()[0];
            if (enabled) {
                let track = activeVideoTrack;
                if (!track) {
                    const cam = await this.ensureCameraStream();
                    track = this.vbEnabled
                        ? this.vbManager.getOutputStream()?.getVideoTracks()[0] ?? cam.getVideoTracks()[0]
                        : cam.getVideoTracks()[0];
                    if (this.vbEnabled) {
                        const vbSourceTrack = this.vbManager.getSourceStream()?.getVideoTracks()[0] ?? cam.getVideoTracks()[0];
                        if (vbSourceTrack)
                            vbSourceTrack.enabled = true;
                    }
                }
                if (track) {
                    track.enabled = true;
                    this.connectionEngine.onLocalTrackSignal(track, true);
                    this.media.setLocalTrack(this.localVideo, track);
                }
                try {
                    if (typeof this.plugin.unmuteVideo === "function") {
                        this.plugin.unmuteVideo();
                    }
                    else {
                        this.plugin.send({ message: { request: "configure", video: true } });
                    }
                }
                catch (e) {
                    Logger.error(ErrorMessages.CALL_VIDEO_UNMUTE_SIGNALING_FAILED, e);
                }
                this.localVideoEnabled = true;
            }
            else {
                try {
                    if (typeof this.plugin.muteVideo === "function") {
                        this.plugin.muteVideo();
                    }
                    else {
                        this.plugin.send({ message: { request: "configure", video: false } });
                    }
                }
                catch (e) {
                    Logger.error(ErrorMessages.CALL_VIDEO_MUTE_SIGNALING_FAILED, e);
                }
                if (activeVideoTrack) {
                    activeVideoTrack.enabled = false;
                    this.connectionEngine.onLocalTrackSignal(activeVideoTrack, false);
                    this.media.setLocalTrack(this.localVideo, activeVideoTrack);
                }
                this.localVideoEnabled = false;
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_VIDEO_TOGGLE_FAILED, e);
            Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
        }
        finally {
            this.videoToggleBusy = false;
            this.bus.emit("video-mute-changed", !this.localVideoEnabled);
        }
        return this.localVideoEnabled;
    }
    markRetrying() {
        this.connectionEngine.onReconnect();
    }
    getNetworkQualityPeers() {
        return {
            publisher: this.publisherPc,
            subscribers: Array.from(this.subscriberPcs.values())
        };
    }
    getParticipantNetworkPeers() {
        return {
            selfId: this.selfId,
            publisher: this.publisherPc,
            subscribers: Array.from(this.subscriberPcs.entries()).map(([feedId, pc]) => ({ feedId, pc }))
        };
    }
    stopVideo() {
        void this.setVideoEnabled(false);
    }
    // =====================================
    // RECORDING
    // =====================================
    setRecordingMeetingContext(groupId, meetingId) {
        this.recordingController.setMeetingContext(groupId, meetingId);
    }
    clearRecordingMeetingContext() {
        this.recordingController.clearMeetingContext();
    }
    async startRecording(source, renderedParticipantCount) {
        await this.recordingController.start(source, renderedParticipantCount);
    }
    stopRecording(source) {
        this.recordingController.stop(source);
    }
    // =====================================
    // LEAVE
    // =====================================
    leave() {
        try {
            this.isLeaving = true;
            this.suppressRemoteFeedRetry = true;
            this.stopAdaptiveNetworkMonitor();
            this.stopMediaStatsLoop();
            this.clearMixedAudioResources();
            this.vbManager.disable();
            this.vbEnabled = false;
            this.screenManager.stop();
            this.screenEnabled = false;
            this.clearRetryTimer();
            this.serverRetryAttempt = 0;
            this.peerRetryAttempt = 0;
            this.recordingController.stopOnLeave();
            try {
                if (this.joinedRoom) {
                    this.plugin?.send({ message: { request: "leave" } });
                }
            }
            catch (e) {
                Logger.error(ErrorMessages.CALL_LEAVE_SIGNALING_FAILED, e);
            }
            this.remoteFeeds?.cleanupAll();
            this.remoteFeeds = null;
            this.plugin = null;
            this.suppressPublisherCleanupRetry = true;
            this.destroyGatewayControlled();
            this.suppressPublisherCleanupRetry = false;
            this.stopParticipantSync();
            this.joinedRoom = false;
            this.currentRoomId = null;
            this.activeJoinCfg = null;
            this.selfId = null;
            this.publisherPc = null;
            this.subscriberPcs.clear();
            this.lastPublisherTransportErrorReason = null;
            this.lastPublisherTransportErrorAt = 0;
            this.peerTelemetryByFeed.clear();
            this.peerNetworkTelemetryByFeed.clear();
            this.localAudioEnabled = true;
            this.localVideoEnabled = true;
            this.audioToggleBusy = false;
            this.videoToggleBusy = false;
            this.screenToggleBusy = false;
            this.vbToggleBusy = false;
            this.roster.reset();
            this.bus.emit("recording-changed", false);
            this.bus.emit("joined", false);
            this.bus.emit("mute-changed", false);
            this.bus.emit("video-mute-changed", false);
            this.connectionEngine.onLeft();
            this.media.clearLocal(this.localVideo);
            this.media.clearRemote(this.remoteVideo);
            this.cameraStream = null;
            this.cameraStreamOrientation = null;
            this.cameraProfileKey = "";
            this.callId = null;
            Logger.setStatus(ErrorMessages.CALL_LEFT);
        }
        catch (e) {
            Logger.setStatus(ErrorMessages.callLeaveErrorStatus(e.message));
            Logger.error(ErrorMessages.CALL_LEAVE_ERROR, e);
        }
    }
    async toggleScreenShare() {
        if (!this.plugin || this.screenToggleBusy)
            return;
        this.screenToggleBusy = true;
        try {
            if (!this.screenEnabled) {
                const ss = await this.screenManager.start();
                const screenTrack = ss.getVideoTracks()[0];
                if (!screenTrack)
                    throw new Error(ErrorMessages.CALL_SCREEN_VIDEO_TRACK_UNAVAILABLE);
                const cam = await this.ensureCameraStream();
                const micTrack = cam.getAudioTracks()[0] ?? null;
                const displayAudioTrack = ss.getAudioTracks()[0] ?? null;
                const outgoingAudio = await this.resolveScreenShareAudioTrack(micTrack, displayAudioTrack);
                if (outgoingAudio)
                    this.syncPublishedAudioTrack(outgoingAudio);
                this.screenEnabled = true;
                await this.ensureOutgoingAudio({ camera: cam, screen: ss });
                this.replaceVideoTrack(screenTrack);
                Logger.setStatus(ErrorMessages.CALL_SCREEN_SHARE_STARTED);
                this.bus.emit("screen-changed", true);
                screenTrack.onended = () => {
                    if (!this.isLeaving && this.screenEnabled)
                        void this.toggleScreenShare();
                };
            }
            else {
                this.screenManager.stop();
                this.clearMixedAudioResources();
                this.screenEnabled = false;
                const cam = await this.ensureCameraStream();
                await this.ensureOutgoingAudio({ camera: cam });
                const videoTrack = cam.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.enabled = this.localVideoEnabled;
                    this.replaceVideoTrack(videoTrack);
                }
                const micTrack = cam.getAudioTracks()[0];
                if (micTrack)
                    this.syncPublishedAudioTrack(micTrack);
                Logger.setStatus(ErrorMessages.CALL_SCREEN_SHARE_STOPPED);
                this.bus.emit("screen-changed", false);
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_SCREEN_SHARE_TOGGLE_FAILED, e);
            Logger.setStatus(MediaErrorUtils.getScreenShareErrorMessage(e));
        }
        finally {
            this.screenToggleBusy = false;
        }
    }
    async toggleVirtualBackground() {
        if (!this.plugin || this.vbToggleBusy)
            return;
        if (this.screenEnabled) {
            Logger.setStatus(ErrorMessages.CALL_DISABLE_SCREEN_BEFORE_VB);
            return;
        }
        this.vbToggleBusy = true;
        try {
            if (!this.vbEnabled) {
                if (!this.localVideoEnabled) {
                    await this.setVideoEnabled(true);
                }
                const cam = await this.ensureCameraStream();
                const camVideoTrack = cam.getVideoTracks()[0];
                if (camVideoTrack)
                    camVideoTrack.enabled = true;
                const processed = await this.vbManager.enable(cam);
                const track = processed.getVideoTracks()[0];
                if (!track)
                    throw new Error(ErrorMessages.CALL_VB_OUTPUT_TRACK_UNAVAILABLE);
                track.enabled = true;
                this.vbEnabled = true;
                this.localVideoEnabled = true;
                this.replaceVideoTrack(track);
                this.guardVirtualBackgroundTrack(track, camVideoTrack ?? null);
                this.bus.emit("video-mute-changed", false);
                this.bus.emit("vb-changed", true);
            }
            else {
                this.vbManager.disable();
                this.vbEnabled = false;
                const cam = await this.ensureCameraStream();
                const track = cam.getVideoTracks()[0];
                if (track) {
                    track.enabled = this.localVideoEnabled;
                    this.replaceVideoTrack(track);
                }
                this.bus.emit("vb-changed", false);
            }
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_VB_TOGGLE_FAILED, e);
            Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
        }
        finally {
            this.vbToggleBusy = false;
        }
    }
    async ensureCameraStream() {
        try {
            const desiredOrientation = this.getViewportOrientation();
            const desiredProfileKey = this.getCurrentCameraProfileKey();
            const currentStream = this.cameraStream;
            const hasLiveVideo = !!currentStream?.getVideoTracks().some(t => t.readyState === "live");
            const hasLiveAudio = !!currentStream?.getAudioTracks().some(t => t.readyState === "live");
            const needsRecreate = !currentStream ||
                !hasLiveVideo ||
                !hasLiveAudio ||
                (this.isIOSDevice() && this.cameraStreamOrientation !== desiredOrientation) ||
                this.cameraProfileKey !== desiredProfileKey;
            if (needsRecreate) {
                const videoConstraints = this.buildVideoConstraintsForCurrentProfile(desiredOrientation);
                const nextStream = await navigator.mediaDevices.getUserMedia({
                    video: videoConstraints,
                    audio: true
                });
                const previous = this.cameraStream;
                this.cameraStream = nextStream;
                this.cameraStreamOrientation = desiredOrientation;
                this.cameraProfileKey = desiredProfileKey;
                const nextAudio = nextStream.getAudioTracks()[0];
                if (nextAudio && (!this.screenEnabled || !this.mixedAudioTrack)) {
                    nextAudio.enabled = this.localAudioEnabled;
                    this.syncPublishedAudioTrack(nextAudio);
                }
                if (previous && previous !== nextStream) {
                    const vbSourceLive = !!this.vbManager
                        .getSourceStream()
                        ?.getVideoTracks()
                        .some((t) => t.readyState === "live");
                    previous.getTracks().forEach(t => {
                        if (nextStream.getTracks().some(nt => nt.id === t.id))
                            return;
                        if (this.vbEnabled && vbSourceLive && t.kind === "video")
                            return;
                        try {
                            t.stop();
                        }
                        catch (stopErr) {
                            Logger.error(ErrorMessages.CALL_STOP_STALE_CAMERA_TRACK_FAILED, stopErr);
                        }
                    });
                }
            }
            if (!this.cameraStream) {
                throw new Error(ErrorMessages.CALL_CAMERA_STREAM_UNAVAILABLE_AFTER_INIT);
            }
            if (!this.cameraProfileKey) {
                this.cameraProfileKey = desiredProfileKey;
            }
            return this.cameraStream;
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_CAMERA_ACCESS_FAILED, e);
            Logger.setStatus(MediaErrorUtils.getCameraMicErrorMessage(e));
            throw e;
        }
    }
    guardVirtualBackgroundTrack(vbTrack, fallbackCameraTrack) {
        window.setTimeout(() => {
            const recover = async () => {
                if (!this.vbEnabled)
                    return;
                const vbTrackBroken = vbTrack.readyState !== "live" || vbTrack.muted === true;
                if (!vbTrackBroken)
                    return;
                Logger.warn("Virtual background output track is not flowing. Falling back to camera.");
                this.vbManager.disable();
                this.vbEnabled = false;
                if (fallbackCameraTrack && fallbackCameraTrack.readyState === "live") {
                    fallbackCameraTrack.enabled = this.localVideoEnabled;
                    this.replaceVideoTrack(fallbackCameraTrack);
                }
                else {
                    const activeCamera = await this.ensureCameraStream();
                    const freshTrack = activeCamera.getVideoTracks()[0];
                    if (freshTrack) {
                        freshTrack.enabled = this.localVideoEnabled;
                        this.replaceVideoTrack(freshTrack);
                    }
                }
                this.bus.emit("vb-changed", false);
                Logger.setStatus(ErrorMessages.CALL_VB_FALLBACK_TO_CAMERA);
            };
            void recover().catch((e) => {
                Logger.error(ErrorMessages.CALL_VB_TOGGLE_FAILED, e);
            });
        }, 1500);
    }
    replaceVideoTrack(track) {
        if (!this.plugin)
            return;
        try {
            this.plugin.replaceTracks({
                tracks: [{ type: "video", capture: track, recv: false }]
            });
            this.connectionEngine.onLocalTrackSignal(track, track.enabled !== false);
            this.media.setLocalTrack(this.localVideo, track);
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_REPLACE_VIDEO_TRACK_FAILED, e);
            Logger.setStatus(ErrorMessages.CALL_VIDEO_TRACK_SWITCH_FAILED);
        }
    }
    getPreferredAudioTrack() {
        if (this.screenEnabled && this.mixedAudioTrack && this.mixedAudioTrack.readyState === "live") {
            return this.mixedAudioTrack;
        }
        const mic = this.cameraStream?.getAudioTracks().find((t) => t.readyState === "live") ?? null;
        return mic;
    }
    syncPreferredAudioTrack() {
        if (!this.plugin)
            return;
        let preferred = this.getPreferredAudioTrack();
        if (!preferred && this.screenEnabled) {
            this.clearMixedAudioResources();
            preferred = this.getPreferredAudioTrack();
        }
        if (!preferred)
            return;
        preferred.enabled = this.localAudioEnabled;
        this.syncPublishedAudioTrack(preferred);
    }
    async ensureOutgoingAudio(opts) {
        if (!this.plugin)
            return;
        const camera = opts?.camera ?? await this.ensureCameraStream();
        if (this.screenEnabled) {
            const screen = opts?.screen ?? this.screenManager.getStream();
            const micTrack = camera.getAudioTracks()[0] ?? null;
            const displayAudioTrack = screen?.getAudioTracks()[0] ?? null;
            const outgoing = await this.resolveScreenShareAudioTrack(micTrack, displayAudioTrack);
            if (outgoing) {
                outgoing.enabled = this.localAudioEnabled;
                this.syncPublishedAudioTrack(outgoing);
            }
            else {
                Logger.warn("No outgoing audio track available during screen share.");
            }
            return;
        }
        if (this.mixedAudioTrack) {
            this.clearMixedAudioResources();
        }
        const micTrack = camera.getAudioTracks()[0] ?? null;
        if (micTrack) {
            micTrack.enabled = this.localAudioEnabled;
            this.syncPublishedAudioTrack(micTrack);
        }
        else {
            Logger.warn("No microphone track available for outgoing audio.");
        }
    }
    syncPublishedAudioTrack(track) {
        if (!this.plugin)
            return;
        try {
            this.plugin.replaceTracks({
                tracks: [{ type: "audio", capture: track, recv: false }]
            });
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_REPLACE_AUDIO_TRACK_FAILED, e);
        }
    }
    async resolveScreenShareAudioTrack(micTrack, displayAudioTrack) {
        this.clearMixedAudioResources();
        if (!micTrack && !displayAudioTrack)
            return null;
        if (!micTrack)
            return displayAudioTrack;
        if (!displayAudioTrack)
            return micTrack;
        try {
            const ctx = new AudioContext();
            const destination = ctx.createMediaStreamDestination();
            const micSource = ctx.createMediaStreamSource(new MediaStream([micTrack]));
            const displaySource = ctx.createMediaStreamSource(new MediaStream([displayAudioTrack]));
            micSource.connect(destination);
            displaySource.connect(destination);
            const mixedTrack = destination.stream.getAudioTracks()[0] ?? null;
            if (!mixedTrack) {
                void ctx.close();
                return micTrack;
            }
            this.mixedAudioContext = ctx;
            this.mixedAudioTrack = mixedTrack;
            return mixedTrack;
        }
        catch (e) {
            Logger.error(ErrorMessages.CALL_SCREEN_AUDIO_MIXING_FAILED, e);
            return micTrack;
        }
    }
    clearMixedAudioResources() {
        if (this.mixedAudioTrack) {
            try {
                this.mixedAudioTrack.stop();
            }
            catch (e) {
                Logger.error(ErrorMessages.CALL_STOP_MIXED_AUDIO_TRACK_FAILED, e);
            }
        }
        this.mixedAudioTrack = null;
        if (this.mixedAudioContext) {
            this.mixedAudioContext.close().catch((e) => {
                Logger.error(ErrorMessages.CALL_CLOSE_MIXED_AUDIO_CONTEXT_FAILED, e);
            });
        }
        this.mixedAudioContext = null;
    }
    startMediaStatsLoop() {
        this.monitoringStat.start();
    }
    stopMediaStatsLoop() {
        this.monitoringStat.stop();
    }
    pickFreshPeerTelemetry(now) {
        let latest = null;
        for (const payload of this.peerTelemetryByFeed.values()) {
            if (now - payload.ts <= APP_CONFIG.mediaTelemetry.peerTelemetryFreshnessMs) {
                if (!latest || payload.ts > latest.ts) {
                    latest = payload;
                }
            }
        }
        return latest;
    }
    sendPeerTelemetry(payload) {
        if (!APP_CONFIG.mediaTelemetry.enablePeerTelemetry)
            return;
        const channel = this.plugin?.data;
        if (typeof channel !== "function")
            return;
        try {
            channel.call(this.plugin, { text: JSON.stringify(payload) });
        }
        catch { }
    }
}
// import {Dom} from "./Dom";
// import {CallController} from "../managers/CallController";
class UIController {
    getQueryParam(key) {
        try {
            return new URLSearchParams(window.location.search).get(key);
        }
        catch {
            return null;
        }
    }
    constructor() {
        this.bus = new EventBus();
        this.btnMute = document.getElementById("btnMute");
        this.btnUnpublish = document.getElementById("btnUnpublish");
        this.btnLeave = document.getElementById("btnLeave");
        this.btnReconnect = document.getElementById("btnReconnect");
        this.btnScreen = document.getElementById("btnScreen");
        this.btnVB = document.getElementById("btnVB");
        // ✅ NEW
        this.btnRecord = document.getElementById("btnRecord");
        this.lastCfg = null;
        this.lastGroupId = null;
        this.autoJoinSeq = 0;
        this.bridge = new ParentBridge();
        this.net = new NetworkQualityManager();
        this.participantNet = new ParticipantNetworkStatsManager();
        this.localVideoEl = document.getElementById("localVideo");
        this.remoteVideoEl = document.getElementById("remoteVideo");
        this.remoteFallback = document.getElementById("remoteFallback");
        this.localOverlay = document.getElementById("localOverlay");
        this.remoteOverlay = document.getElementById("remoteOverlay");
        this.endedOverlay = document.getElementById("endedOverlay");
        this.localQ = document.getElementById("localQuality");
        this.remoteQ = document.getElementById("remoteQuality");
        this.localQD = document.getElementById("localQualityDetails");
        this.remoteQD = document.getElementById("remoteQualityDetails");
        this.networkSidePanel = document.getElementById("networkSidePanel");
        this.networkPanelBtn = document.getElementById("networkPanelBtn");
        this.networkPanelPopup = document.getElementById("networkPanelPopup");
        this.networkPanelClose = document.getElementById("networkPanelClose");
        this.networkPopupBody = document.getElementById("networkPopupBody");
        this.callMeta = document.getElementById("callMeta");
        this.mediaIoBytes = document.getElementById("mediaIoBytes");
        this.mediaIoIssues = document.getElementById("mediaIoIssues");
        this.mRemoteRecvVideo = document.getElementById("mRemoteRecvVideo");
        this.mRemoteRecvAudio = document.getElementById("mRemoteRecvAudio");
        this.mRemoteAudioPlayback = document.getElementById("mRemoteAudioPlayback");
        this.mRemoteVideoPlayback = document.getElementById("mRemoteVideoPlayback");
        this.mLocalRecvVideo = document.getElementById("mLocalRecvVideo");
        this.mLocalRecvAudio = document.getElementById("mLocalRecvAudio");
        this.mLocalAudioPlayback = document.getElementById("mLocalAudioPlayback");
        this.mLocalVideoPlayback = document.getElementById("mLocalVideoPlayback");
        this.prevMediaBytes = null;
        this.audioMuted = false;
        this.videoMuted = false;
        this.ended = false;
        this.userType = this.resolveUserType();
        this.canRecord = this.userType === "agent";
        // ✅ recording state
        this.recording = false;
        this.renderedParticipantCount = 0;
        this.lastRemoteVideoTime = 0;
        this.remoteVideoFrameProgressAt = 0;
        this.connectionStatus = null;
        this.remoteVideoMonitorTimer = null;
        const qn = this.getQueryParam("name");
        if (qn)
            Logger.setUserName(qn);
        Logger.user("UI loaded. Initializing controllers...");
        Logger.flow("DOMContentLoaded → UIController()");
        this.logger = new Logger(document.getElementById("statusLine"), document.getElementById("sessionInfo"));
        const localVideo = this.localVideoEl;
        const remoteVideo = this.remoteVideoEl;
        this.controller = new CallController(this.bus, localVideo, remoteVideo);
        this.applyRecordingAccess();
        this.bus.on("joined", j => {
            this.setJoinedState(j);
            console.log("VCX_JOINED=" + j);
            this.updateDebugState({
                joined: j
            });
        });
        this.bus.on("mute-changed", muted => {
            this.audioMuted = muted;
            this.btnMute.classList.toggle("danger", muted);
            this.btnMute.innerHTML =
                muted
                    ? '<i class="fa-solid fa-microphone-slash"></i>'
                    : '<i class="fa-solid fa-microphone"></i>';
            this.applyConnectionOverlays();
            this.bridge.emit({ type: "AUDIO_MUTED", muted });
        });
        this.bus.on("video-mute-changed", muted => {
            this.videoMuted = muted;
            this.btnUnpublish.classList.toggle("danger", muted);
            this.btnUnpublish.innerHTML =
                muted
                    ? '<i class="fa-solid fa-video-slash"></i>'
                    : '<i class="fa-solid fa-video"></i>';
            this.applyConnectionOverlays();
        });
        this.bus.on("screen-changed", on => {
            this.btnScreen.title = on ? "Stop Screen Share" : "Start Screen Share";
        });
        this.bus.on("vb-changed", on => {
            this.btnVB.title = on ? "Disable Virtual Background" : "Enable Virtual Background";
        });
        this.bus.on("recording-changed", isRecording => {
            this.recording = isRecording;
            this.updateRecordUI();
            this.updateDebugState({
                recording: isRecording
            });
            this.bridge.emit({
                type: "RECORDING_CHANGED",
                recording: isRecording
            });
        });
        this.bus.on("participants", (snapshot) => {
            const count = snapshot.participantIds.length;
            Logger.user(`Roster participants count: ${count}`);
            // SIMPLE LOG (automation-friendly)
            console.log("VCX_ROSTER_PARTICIPANTS=" + count);
            this.updateDebugState({
                rosterParticipants: count
            });
        });
        this.bus.on("telemetry-context", (ctx) => {
            this.updateDebugState({
                callId: ctx?.callId,
                roomId: ctx?.roomId,
                participantId: ctx?.participantId
            });
        });
        this.bus.on("connectivity", (s) => {
            this.updateDebugState({
                iceState: s.ice,
                signalingState: s.signaling,
                connectionState: s.connection
            });
        });
        this.bus.on("connection-status", (status) => {
            this.renderConnectionStatus(status);
        });
        this.bus.on("media-io", (stats) => {
            this.renderMediaIo(stats);
        });
        this.bus.on("janus-slowlink", (signal) => {
            this.participantNet.recordSlowLink(signal);
        });
        this.bus.on("peer-network-telemetry", (evt) => {
            this.participantNet.recordRemoteNetworkTelemetry(evt.feedId, evt.payload);
        });
        this.bus.on("call-ended", (payload) => {
            Logger.user(`Call ended event received: ${payload?.reason || "unknown"}`);
            this.setEndedState(true);
        });
        this.wire();
        this.setupNetworkUI();
        this.setupParticipantNetworkPanel();
        this.setupParentBridge();
        this.setupRemoteFallbackMonitor();
        this.autoJoin();
    }
    wire() {
        // AUDIO
        this.btnMute.onclick = () => {
            Logger.user("Audio button clicked -> toggle mute");
            this.controller.toggleMute();
        };
        // VIDEO
        this.btnUnpublish.onclick = async () => {
            Logger.user("Video button clicked");
            if (this.btnUnpublish.disabled)
                return;
            this.btnUnpublish.disabled = true;
            try {
                const enabled = await this.controller.setVideoEnabled(this.videoMuted);
                this.videoMuted = !enabled;
            }
            finally {
                if (!this.ended)
                    this.btnUnpublish.disabled = false;
            }
            this.applyConnectionOverlays();
            this.bridge.emit({ type: "VIDEO_MUTED", muted: this.videoMuted });
        };
        // LEAVE / START
        this.btnLeave.onclick = () => {
            if (!this.ended) {
                Logger.user("End button clicked");
                this.controller.leave();
                this.setEndedState(true);
                this.bridge.emit({ type: "CALL_ENDED" });
            }
            else {
                Logger.user("Start button clicked");
                this.autoJoin();
            }
        };
        this.btnReconnect.onclick = () => this.reconnect();
        this.btnScreen.onclick = async () => {
            if (this.btnScreen.disabled)
                return;
            this.btnScreen.disabled = true;
            try {
                await this.controller.toggleScreenShare();
            }
            finally {
                if (!this.ended)
                    this.btnScreen.disabled = false;
            }
        };
        this.btnVB.onclick = async () => {
            if (this.btnVB.disabled)
                return;
            this.btnVB.disabled = true;
            try {
                await this.controller.toggleVirtualBackground();
            }
            finally {
                if (!this.ended)
                    this.btnVB.disabled = false;
            }
        };
        // ✅ RECORD BUTTON
        if (this.btnRecord) {
            this.btnRecord.onclick = () => {
                if (this.recording) {
                    this.stopRecording("manual");
                }
                else {
                    void this.startRecording("manual");
                }
            };
        }
    }
    resolveUserType() {
        const raw = this.getQueryParam("user_type") ??
            this.getQueryParam("usertpye") ??
            this.getQueryParam("usertype") ??
            "";
        return raw.trim().toLowerCase() === "agent" ? "agent" : "customer";
    }
    applyRecordingAccess() {
        if (!this.btnRecord)
            return;
        if (this.canRecord)
            return;
        this.btnRecord.style.display = "none";
        this.btnRecord.disabled = true;
    }
    syncAutoRecordingByParticipants(participantCount) {
        const shouldRecord = participantCount === 2;
        if (shouldRecord && !this.recording) {
            void this.startRecording("auto");
            return;
        }
        if (!shouldRecord && this.recording) {
            this.stopRecording("auto");
        }
    }
    async startRecording(source) {
        await this.controller.startRecording(source, this.renderedParticipantCount);
    }
    stopRecording(source) {
        this.controller.stopRecording(source);
    }
    updateRecordUI() {
        if (!this.btnRecord)
            return;
        if (this.recording) {
            this.btnRecord.classList.add("danger");
            this.btnRecord.innerHTML =
                '<i class="fa-solid fa-stop"></i>';
            this.btnRecord.title = "Stop Recording";
        }
        else {
            this.btnRecord.classList.remove("danger");
            this.btnRecord.innerHTML =
                '<i class="fa-solid fa-circle"></i>';
            this.btnRecord.title = "Start Recording";
        }
    }
    setEndedState(ended) {
        this.ended = ended;
        this.endedOverlay.style.display = ended ? "flex" : "none";
        this.renderRemoteFallback();
        if (ended) {
            this.btnLeave.innerHTML = '<i class="fa-solid fa-play"></i>';
            this.btnLeave.title = "Start";
            this.btnLeave.disabled = false;
            return;
        }
        this.btnLeave.innerHTML = '<i class="fa-solid fa-phone-slash"></i>';
        this.btnLeave.title = "End";
    }
    async autoJoin() {
        let req;
        try {
            req = UrlConfig.buildJoinConfig();
        }
        catch (e) {
            Logger.error("Join config parse failed", e);
            return;
        }
        const joinSeq = ++this.autoJoinSeq;
        this.lastGroupId = req.groupId;
        this.controller.clearRecordingMeetingContext();
        this.recording = false;
        this.renderedParticipantCount = 0;
        this.lastRemoteVideoTime = 0;
        this.remoteVideoFrameProgressAt = 0;
        this.updateRecordUI();
        this.renderCallMeta(req.display, req.participantId);
        Logger.setStatus(`Creating meeting... groupId=${req.groupId}, name=${req.display}${req.participantId ? `, participantId=${req.participantId}` : ""}`);
        Logger.user(`[rms] create meeting request groupId=${req.groupId} (payload groupId=null, to=${req.groupId})`);
        this.audioMuted = false;
        this.videoMuted = false;
        this.setEndedState(false);
        this.applyConnectionOverlays();
        try {
            const roomId = await this.resolveMeetingRoomId(req.groupId);
            if (joinSeq !== this.autoJoinSeq)
                return;
            const cfg = {
                server: req.server,
                roomId,
                display: req.display,
                participantId: req.participantId
            };
            this.lastCfg = cfg;
            this.controller.setRecordingMeetingContext(req.groupId, cfg.roomId);
            this.renderCallMeta(cfg.display, cfg.participantId, cfg.roomId);
            this.updateDebugState({
                groupId: req.groupId,
                roomId: cfg.roomId
            });
            Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}${cfg.participantId ? `, participantId=${cfg.participantId}` : ""}`);
            this.controller.join(cfg);
            this.bridge.emit({ type: "CALL_STARTED" });
        }
        catch (e) {
            if (joinSeq !== this.autoJoinSeq)
                return;
            Logger.error(ErrorMessages.RMS_MEETING_CREATE_FAILED, e);
            Logger.setStatus(ErrorMessages.RMS_MEETING_CREATE_FAILED);
        }
    }
    async resolveMeetingRoomId(groupId) {
        const server = UrlConfig.getVcxServer().server;
        const clientId = UrlConfig.getVcxServer().client_id;
        const http = new HttpClient(server, clientId);
        const rms = new RmsClient(http);
        const meetingId = await rms.createMeetingByGroup(groupId);
        Logger.user(`[rms] meeting created groupId=${groupId} -> meetingId(roomId)=${meetingId}`);
        return meetingId;
    }
    renderCallMeta(display, participantId, roomId) {
        if (!this.callMeta)
            return;
        const groupText = this.lastGroupId ?? "-";
        const roomText = Number.isFinite(roomId) ? String(roomId) : "Pending";
        this.callMeta.textContent =
            `GroupId: ${groupText} | RoomId: ${roomText} | Name: ${display}` +
                `${participantId ? ` | ParticipantId: ${participantId}` : ""}`;
    }
    reconnect() {
        if (!this.lastCfg)
            return;
        this.controller.leave();
        this.controller.markRetrying();
        this.renderRemoteFallback();
        // safer Janus reconnect
        setTimeout(() => {
            this.controller.join(this.lastCfg);
        }, APP_CONFIG.call.reconnectDelayMs);
    }
    setJoinedState(joined) {
        [
            this.btnMute,
            this.btnUnpublish,
            this.btnReconnect,
            this.btnScreen,
            this.btnVB
        ].forEach(b => b && (b.disabled = !joined));
        this.btnLeave.disabled = this.ended ? false : !joined;
        if (this.btnRecord) {
            this.btnRecord.disabled = !joined || !this.canRecord;
        }
    }
    getLocalBaseOverlayText() {
        if (this.videoMuted)
            return "video muted";
        if (this.audioMuted)
            return "audio muted";
        return "Local";
    }
    getRemoteBaseOverlayText() {
        return "Remote";
    }
    applyConnectionOverlays() {
        const localBase = this.getLocalBaseOverlayText();
        const remoteBase = this.getRemoteBaseOverlayText();
        const status = this.connectionStatus;
        if (!status) {
            this.localOverlay.innerText = localBase;
            this.remoteOverlay.innerText = remoteBase;
            return;
        }
        if (status.owner === "LOCAL") {
            this.localOverlay.innerText = status.primaryText;
            this.remoteOverlay.innerText = remoteBase;
            return;
        }
        if (status.owner === "REMOTE") {
            this.remoteOverlay.innerText = status.primaryText;
            this.localOverlay.innerText = localBase;
            return;
        }
        this.localOverlay.innerText = localBase;
        this.remoteOverlay.innerText = remoteBase;
    }
    renderConnectionStatus(status) {
        const resolved = this.resolveVisibleConnectionStatus(status);
        this.connectionStatus = resolved;
        this.logger.setStatus(resolved.primaryText);
        this.logger.setInfo(resolved.secondaryText);
        this.applyConnectionOverlays();
        this.renderRemoteFallback();
        this.updateDebugState({
            connectionOwner: resolved.owner,
            connectionSeverity: resolved.severity,
            connectionState: resolved.state
        });
    }
    resolveVisibleConnectionStatus(status) {
        // Keep hard failures visible as-is.
        if (status.severity === "error" || status.state === "FAILED") {
            return status;
        }
        const inSetupPhase = status.state === "NEGOTIATING" || status.state === "WAITING_REMOTE";
        if (!inSetupPhase) {
            return status;
        }
        // If both videos are actually live in the UI, present connected state.
        if (this.hasLocalVideoTrack() && this.hasRemoteVideoTrack()) {
            return {
                owner: "NEUTRAL",
                severity: "info",
                state: "CONNECTED",
                primaryText: "Connected",
                secondaryText: "Video and audio are live."
            };
        }
        return status;
    }
    setupRemoteFallbackMonitor() {
        const refresh = () => {
            this.refreshRenderedParticipantCount();
            this.renderRemoteFallback();
        };
        this.localVideoEl.onloadeddata = refresh;
        this.localVideoEl.onplaying = refresh;
        this.localVideoEl.onemptied = refresh;
        this.localVideoEl.onpause = refresh;
        this.remoteVideoEl.onloadeddata = refresh;
        this.remoteVideoEl.onplaying = refresh;
        this.remoteVideoEl.onemptied = refresh;
        this.remoteVideoEl.onpause = refresh;
        if (this.remoteVideoMonitorTimer !== null) {
            window.clearInterval(this.remoteVideoMonitorTimer);
        }
        this.remoteVideoMonitorTimer = window.setInterval(refresh, APP_CONFIG.ui.remoteFallbackRefreshMs);
        refresh();
    }
    hasLiveVideoTrack(videoEl) {
        const ms = videoEl.srcObject;
        if (!ms)
            return false;
        const tracks = ms.getVideoTracks();
        if (!tracks || tracks.length === 0)
            return false;
        return tracks.some(t => t.readyState === "live" && t.enabled !== false);
    }
    hasRenderableVideoTrack(videoEl) {
        if (!this.hasLiveVideoTrack(videoEl))
            return false;
        const hasDecodedFrame = videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            videoEl.videoWidth > 0 &&
            videoEl.videoHeight > 0;
        const isPlaying = !videoEl.paused;
        return hasDecodedFrame && isPlaying;
    }
    hasLocalVideoTrack() {
        // Local participant is considered present when local camera track is live.
        return this.hasLiveVideoTrack(this.localVideoEl);
    }
    hasRemoteVideoTrack() {
        this.updateRemoteVideoProgress();
        if (!this.hasRenderableVideoTrack(this.remoteVideoEl))
            return false;
        if (this.remoteVideoFrameProgressAt === 0)
            return false;
        return Date.now() - this.remoteVideoFrameProgressAt <= APP_CONFIG.ui.remoteVideoStallThresholdMs;
    }
    updateRemoteVideoProgress() {
        const now = Date.now();
        if (!this.hasLiveVideoTrack(this.remoteVideoEl)) {
            this.lastRemoteVideoTime = 0;
            this.remoteVideoFrameProgressAt = 0;
            return;
        }
        const currentTime = Number.isFinite(this.remoteVideoEl.currentTime) ? this.remoteVideoEl.currentTime : 0;
        if (currentTime + 0.01 < this.lastRemoteVideoTime) {
            this.lastRemoteVideoTime = currentTime;
            this.remoteVideoFrameProgressAt = 0;
            return;
        }
        if (currentTime > this.lastRemoteVideoTime + 0.03) {
            this.lastRemoteVideoTime = currentTime;
            this.remoteVideoFrameProgressAt = now;
            return;
        }
        if (this.remoteVideoFrameProgressAt === 0 && currentTime > 0) {
            this.remoteVideoFrameProgressAt = now;
        }
    }
    refreshRenderedParticipantCount() {
        this.updateRemoteVideoProgress();
        const count = (this.hasLocalVideoTrack() ? 1 : 0) +
            (this.hasRemoteVideoTrack() ? 1 : 0);
        if (count === this.renderedParticipantCount)
            return;
        this.renderedParticipantCount = count;
        Logger.user(`Rendered participants count: ${count}`);
        console.log("VCX_PARTICIPANTS=" + count);
        this.updateDebugState({
            participants: count,
            participantsRendered: count
        });
        this.syncAutoRecordingByParticipants(count);
    }
    renderRemoteFallback() {
        if (!this.remoteFallback)
            return;
        const showFallback = !this.ended && !this.hasRemoteVideoTrack();
        this.remoteFallback.style.display = showFallback ? "flex" : "none";
    }
    formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0)
            return "0B";
        if (bytes < 1024)
            return `${Math.floor(bytes)}B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    }
    formatQuality(v) {
        if (v === null || !Number.isFinite(v))
            return "n/a";
        return `${v.toFixed(1)}`;
    }
    formatFlowBytes(current, previous, minDeltaBytes, forceStopped = false) {
        const delta = previous === null ? 0 : Math.max(0, current - previous);
        const flowing = !forceStopped && delta >= minDeltaBytes;
        const symbol = flowing ? "+" : "x";
        const color = flowing ? "#16a34a" : "#dc2626";
        return {
            text: `${this.formatBytes(delta)} [${symbol}]`,
            color
        };
    }
    renderStatusBadge(el, value) {
        const normalized = String(value || "").trim();
        let symbol = "•";
        let color = "#6b7280";
        if (normalized === "Yes" || normalized === "Active") {
            symbol = "✔";
            color = "#16a34a";
        }
        else if (normalized === "No" || normalized === "Stalled" || normalized === "Not possible") {
            symbol = "✖";
            color = "#dc2626";
        }
        else if (normalized === "Pending") {
            symbol = "•";
            color = "#d97706";
        }
        el.textContent = `${symbol} ${normalized}`;
        el.style.color = color;
        el.style.fontWeight = "600";
    }
    renderMediaIo(stats) {
        if (this.mediaIoBytes) {
            const prev = this.prevMediaBytes;
            const audioMinDeltaBytes = 64;
            const videoMinDeltaBytes = 512;
            const aSent = this.formatFlowBytes(stats.bytes.audioSent, prev?.audioSent ?? null, audioMinDeltaBytes, this.audioMuted);
            const aRecv = this.formatFlowBytes(stats.bytes.audioReceived, prev?.audioReceived ?? null, audioMinDeltaBytes, false);
            const vSent = this.formatFlowBytes(stats.bytes.videoSent, prev?.videoSent ?? null, videoMinDeltaBytes, this.videoMuted);
            const vRecv = this.formatFlowBytes(stats.bytes.videoReceived, prev?.videoReceived ?? null, videoMinDeltaBytes, false);
            this.mediaIoBytes.innerHTML =
                `A(sent/recv): <span style="color:${aSent.color};font-weight:600">${aSent.text}</span> / ` +
                    `<span style="color:${aRecv.color};font-weight:600">${aRecv.text}</span> | ` +
                    `V(sent/recv): <span style="color:${vSent.color};font-weight:600">${vSent.text}</span> / ` +
                    `<span style="color:${vRecv.color};font-weight:600">${vRecv.text}</span>`;
        }
        if (this.mediaIoIssues) {
            this.mediaIoIssues.textContent = stats.issues.length > 0
                ? stats.issues.join(" | ")
                : "";
        }
        this.renderStatusBadge(this.mRemoteRecvVideo, stats.matrix.remoteReceivingYourVideo);
        this.renderStatusBadge(this.mRemoteRecvAudio, stats.matrix.remoteReceivingYourAudio);
        this.renderStatusBadge(this.mRemoteAudioPlayback, stats.matrix.remoteAudioPlaybackStatus);
        this.renderStatusBadge(this.mRemoteVideoPlayback, stats.matrix.remoteVideoPlaybackStatus);
        this.renderStatusBadge(this.mLocalRecvVideo, stats.matrix.localReceivingYourVideo);
        this.renderStatusBadge(this.mLocalRecvAudio, stats.matrix.localReceivingYourAudio);
        this.renderStatusBadge(this.mLocalAudioPlayback, stats.matrix.localAudioPlaybackStatus);
        this.renderStatusBadge(this.mLocalVideoPlayback, stats.matrix.localVideoPlaybackStatus);
        this.localQD.textContent =
            `jitter=${this.formatQuality(stats.quality.localJitterMs)}ms loss=${this.formatQuality(stats.quality.localLossPct)}%`;
        this.remoteQD.textContent =
            `jitter=${this.formatQuality(stats.quality.remoteJitterMs)}ms loss=${this.formatQuality(stats.quality.remoteLossPct)}%`;
        this.prevMediaBytes = { ...stats.bytes };
    }
    setupNetworkUI() {
        const toggle = (el) => el.classList.toggle("show");
        this.localQ.onclick = () => toggle(this.localQD);
        this.remoteQ.onclick = () => toggle(this.remoteQD);
        this.net.start((l, r, d) => {
            this.localQ.textContent = `Local: ${l}`;
            this.remoteQ.textContent = `Remote: ${r}`;
            this.localQD.textContent = d;
            this.remoteQD.textContent = d;
            Logger.net(`Local ${l} | Remote ${r} | ${d}`);
            this.bridge.emit({
                type: "NETWORK_CHANGED",
                local: l,
                remote: r
            });
        }, () => this.controller.getNetworkQualityPeers());
    }
    setupParticipantNetworkPanel() {
        if (!this.networkSidePanel ||
            !this.networkPanelBtn ||
            !this.networkPanelPopup ||
            !this.networkPopupBody ||
            !this.networkPanelClose) {
            return;
        }
        const closePopup = () => {
            this.networkPanelPopup.classList.remove("show");
        };
        const openPopup = () => {
            this.networkPanelPopup.classList.add("show");
        };
        this.networkPanelBtn.onclick = () => {
            if (!this.isParticipantNetworkPopupMode())
                return;
            if (this.networkPanelPopup.classList.contains("show")) {
                closePopup();
            }
            else {
                openPopup();
            }
        };
        this.networkPanelClose.onclick = closePopup;
        this.networkPanelPopup.onclick = (ev) => {
            if (ev.target === this.networkPanelPopup)
                closePopup();
        };
        window.addEventListener("resize", () => {
            if (!this.isParticipantNetworkPopupMode()) {
                closePopup();
            }
        });
        this.participantNet.start((snapshot) => this.renderParticipantNetwork(snapshot), () => this.controller.getParticipantNetworkPeers());
    }
    isParticipantNetworkPopupMode() {
        return window.innerWidth <= APP_CONFIG.networkQuality.participantPanel.popupBreakpointPx;
    }
    renderParticipantNetwork(snapshot) {
        if (!this.networkSidePanel || !this.networkPopupBody)
            return;
        const updated = new Date(snapshot.updatedAt).toLocaleTimeString();
        const content = this.renderParticipantNetworkRows(snapshot.rows);
        const html = `<div class="network-panel-title">Participant Network</div>` +
            `<div class="network-panel-updated">Updated: ${updated}</div>` +
            content;
        this.networkSidePanel.innerHTML = html;
        this.networkPopupBody.innerHTML = html;
    }
    renderParticipantNetworkRows(rows) {
        if (!rows || rows.length === 0) {
            return '<div class="network-empty">Pending stats...</div>';
        }
        return rows.map((row) => this.renderParticipantNetworkRow(row)).join("");
    }
    renderParticipantNetworkRow(row) {
        const label = this.escapeHtml(row.label || "Participant");
        const upload = this.renderParticipantMetric("Upload", row.upload);
        const download = this.renderParticipantMetric("Download", row.download);
        const remoteUpload = this.renderParticipantMetric("Remote Upload", row.remoteUpload);
        const remoteDownload = this.renderParticipantMetric("Remote Download", row.remoteDownload);
        const quality = this.renderParticipantQualityGrid(row);
        return (`<div class="network-row">` +
            `<div class="network-row-header">${label}</div>` +
            `<div class="network-row-grid">` +
            upload + download + remoteUpload + remoteDownload +
            `</div>` +
            quality +
            this.renderSlowLinkSummary(row) +
            this.renderBottleneckSummary(row.likelyBottleneck) +
            `<div class="network-row-strip">` +
            `<span class="network-strip-seg ${this.tierClass(row.upload.tier)}"></span>` +
            `<span class="network-strip-seg ${this.tierClass(row.download.tier)}"></span>` +
            `<span class="network-strip-seg ${this.tierClass(row.remoteUpload.tier)}"></span>` +
            `<span class="network-strip-seg ${this.tierClass(row.remoteDownload.tier)}"></span>` +
            `</div>` +
            `<div class="network-strip-legend">U | D | RU | RD</div>` +
            `</div>`);
    }
    renderBottleneckSummary(value) {
        const cls = value === "You" ? "bneck-you" :
            value === "Remote" ? "bneck-remote" :
                value === "Both" ? "bneck-both" :
                    "bneck-unknown";
        return `<div class="network-bottleneck ${cls}">Likely bottleneck: ${value}</div>`;
    }
    renderSlowLinkSummary(row) {
        const uplink = row.upload.slowLink || row.remoteDownload.slowLink;
        const downlink = row.download.slowLink || row.remoteUpload.slowLink;
        if (!uplink && !downlink) {
            return '<div class="network-slowlink network-slowlink-none">SlowLink: None</div>';
        }
        const parts = [];
        if (uplink)
            parts.push("Uplink");
        if (downlink)
            parts.push("Downlink");
        return `<div class="network-slowlink network-slowlink-active">SlowLink: ${parts.join(" + ")}</div>`;
    }
    renderParticipantMetric(label, direction) {
        const cls = this.tierClass(direction.tier);
        const kbps = this.formatParticipantSpeed(direction.kbps);
        const slowTag = direction.slowLink ? " SlowLink" : "";
        return (`<div class="network-metric">` +
            `<div class="network-metric-label">${label}</div>` +
            `<div class="network-metric-value ${cls}">${kbps} (${direction.tier}${slowTag})</div>` +
            `</div>`);
    }
    renderParticipantQualityGrid(row) {
        const q = row.quality;
        const localRtt = this.renderParticipantQualityMetric("Local RTT", q.localRttMs, "ms", this.classifyRttTier(q.localRttMs));
        const localJitter = this.renderParticipantQualityMetric("Local Jitter", q.localJitterMs, "ms", this.classifyJitterTier(q.localJitterMs));
        const localLoss = this.renderParticipantQualityMetric("Local Loss", q.localLossPct, "%", this.classifyLossTier(q.localLossPct));
        const remoteRtt = this.renderParticipantQualityMetric("Remote RTT", q.remoteRttMs, "ms", this.classifyRttTier(q.remoteRttMs));
        const remoteJitter = this.renderParticipantQualityMetric("Remote Jitter", q.remoteJitterMs, "ms", this.classifyJitterTier(q.remoteJitterMs));
        const remoteLoss = this.renderParticipantQualityMetric("Remote Loss", q.remoteLossPct, "%", this.classifyLossTier(q.remoteLossPct));
        return (`<div class="network-row-grid network-row-grid-quality">` +
            localRtt + localJitter + localLoss + remoteRtt + remoteJitter + remoteLoss +
            `</div>`);
    }
    renderParticipantQualityMetric(label, value, unit, tier) {
        const cls = this.tierClass(tier);
        const rendered = this.formatParticipantQualityValue(value, unit);
        return (`<div class="network-metric">` +
            `<div class="network-metric-label">${label}</div>` +
            `<div class="network-metric-value ${cls}">${rendered}${value !== null ? ` (${tier})` : ""}</div>` +
            `</div>`);
    }
    classifyJitterTier(value) {
        if (value === null || !Number.isFinite(value))
            return "Pending";
        const goodMax = APP_CONFIG.networkQuality.thresholds.jitterGoodMs;
        const mediumMax = goodMax * 2;
        if (value <= goodMax)
            return "Good";
        if (value <= mediumMax)
            return "Medium";
        return "Low";
    }
    classifyRttTier(value) {
        if (value === null || !Number.isFinite(value))
            return "Pending";
        const goodMax = APP_CONFIG.networkQuality.thresholds.rttGoodMs;
        const mediumMax = goodMax * 2;
        if (value <= goodMax)
            return "Good";
        if (value <= mediumMax)
            return "Medium";
        return "Low";
    }
    classifyLossTier(value) {
        if (value === null || !Number.isFinite(value))
            return "Pending";
        const goodMax = APP_CONFIG.networkQuality.thresholds.lossGoodPct;
        const mediumMax = goodMax * 2;
        if (value <= goodMax)
            return "Good";
        if (value <= mediumMax)
            return "Medium";
        return "Low";
    }
    formatParticipantQualityValue(value, unit) {
        if (value === null || !Number.isFinite(value))
            return "Pending";
        return `${value.toFixed(1)} ${unit}`;
    }
    formatParticipantSpeed(kbps) {
        if (kbps === null || !Number.isFinite(kbps))
            return "Pending";
        if (kbps >= 1000)
            return `${(kbps / 1000).toFixed(2)} Mbps`;
        return `${kbps.toFixed(0)} kbps`;
    }
    tierClass(tier) {
        if (tier === "Good")
            return "tier-good";
        if (tier === "Medium")
            return "tier-medium";
        if (tier === "Low")
            return "tier-low";
        return "tier-pending";
    }
    escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
    setupParentBridge() {
        this.bridge.onCommand((cmd) => {
            switch (cmd.type) {
                case "START_CALL":
                    if (this.lastCfg) {
                        this.controller.join(this.lastCfg);
                    }
                    else {
                        void this.autoJoin();
                    }
                    break;
                case "STOP_CALL":
                    this.controller.leave();
                    this.setEndedState(true);
                    break;
                case "TOGGLE_AUDIO":
                    this.btnMute.click();
                    break;
                case "TOGGLE_VIDEO":
                    this.btnUnpublish.click();
                    break;
                case "RECONNECT":
                    this.reconnect();
                    break;
                // ✅ recording events
                case "START_RECORDING":
                    void this.startRecording("manual");
                    break;
                case "STOP_RECORDING":
                    this.stopRecording("manual");
                    break;
                case "TOGGLE_RECORDING":
                    this.btnRecord.click();
                    break;
            }
        });
    }
    updateDebugState(extra = {}) {
        const dbg = window.__vcxDebug || {};
        window.__vcxDebug = {
            ...dbg,
            ...extra,
            timestamp: Date.now()
        };
        console.log("VCX_DEBUG", window.__vcxDebug);
    }
}
// src/app.ts
// import {UIController} from "./ui/UIController";
window.addEventListener("DOMContentLoaded", () => {
    console.log("page loaded");
    new UIController();
});
//# sourceMappingURL=app.js.map