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
        imsBaseUrl: "https://localhost.beta.videocx.io",
        clientId: "101",
        defaultJanusServer: "wss://localhost.beta.videocx.io/mstream_janus",
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
        maxFramerateCap: 30
    },
    call: {
        reconnectDelayMs: 800,
        participantSyncIntervalMs: 8000,
        participantSyncCooldownMs: 2500,
        remoteFeedRetryDelayMs: 1200,
        retry: {
            serverMaxAttempts: 3,
            serverDelayMs: 3000,
            peerMaxAttempts: 3,
            peerDelayMs: 3000
        }
    },
    ui: {
        remoteFallbackRefreshMs: 2500
    },
    recording: {
        folderPath: "/opt/efs-janus-app/dev/VideoRecDownloads",
        autoStartParticipantThreshold: 2
    },
    networkQuality: {
        sampleIntervalMs: 3000,
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
        if (this.statusEl)
            this.statusEl.textContent = msg;
        Logger.user(msg);
    }
    setInfo(msg) {
        if (this.infoEl)
            this.infoEl.textContent = msg;
        if (msg)
            Logger.flow(msg);
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
            console.error(e);
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
        const roomIdRaw = this.getString("roomId", "");
        if (!roomIdRaw) {
            alert("This call link is missing a room ID, so we can’t join yet.Please open the full link again or add ?roomId=1234 to the URL.");
            throw new Error("Missing required query param: roomId");
        }
        const roomId = parseInt(roomIdRaw, 10);
        if (!Number.isFinite(roomId)) {
            alert("This call link is missing a room ID, so we can’t join yet.Please open the full link again or add ?roomId=1234 to the URL.");
            throw new Error("Invalid query param: roomId must be a number");
        }
        return {
            server: this.getString("server", APP_CONFIG.vcx.defaultJanusServer),
            roomId,
            display: this.getString("name", APP_CONFIG.vcx.defaultDisplayName)
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
            "Call is ready. Waiting for participant...",
            "Standing by for remote join..."
        ],
        secondary: [
            "You are connected and ready.",
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
        catch { }
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
    }
    setLocalTrack(video, track) {
        if (!this.localPreviewStream)
            this.localPreviewStream = new MediaStream();
        this.localPreviewStream.getTracks().forEach(t => this.localPreviewStream.removeTrack(t));
        this.localPreviewStream.addTrack(track);
        video.srcObject = this.localPreviewStream;
        video.muted = true;
        video.play().catch(() => { });
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
                catch { }
            }
        });
        ms.addTrack(track);
        video.srcObject = ms;
        video.play().catch(() => { });
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
        this.srcStream = null;
        this.outStream = null;
        // IMPORTANT: put virtual.jpeg next to index.html
        this.bgUrl = this.getBgUrl();
        // For local file (same origin), no crossOrigin needed
        this.bg.src = this.bgUrl;
        this.canvas = document.createElement("canvas");
        const c = this.canvas.getContext("2d");
        if (!c)
            throw new Error("No canvas 2d");
        this.ctx = c;
        this.inVideo = document.createElement("video");
        this.inVideo.autoplay = true;
        this.inVideo.playsInline = true;
        this.inVideo.muted = true;
    }
    getBgUrl() {
        // Same folder as index.html (works even with query params)
        // http://localhost/app/index.html?x=1 -> http://localhost/app/virtual.jpeg
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
            img.crossOrigin = "anonymous";
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
    async enable(stream) {
        this.srcStream = stream;
        this.inVideo.srcObject = stream;
        await this.inVideo.play().catch(() => { });
        await this.ensureBgLoaded();
        if (!this.seg) {
            this.seg = new SelfieSegmentation({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
            });
            this.seg.setOptions({ modelSelection: 1 });
            this.seg.onResults((r) => this.onResults(r));
        }
        this.running = true;
        this.loop();
        // 24 fps is OK for mobile; adjust if needed
        this.outStream = this.canvas.captureStream(24);
        Logger.user("Virtual background enabled");
        Logger.setStatus("Virtual background enabled");
        return this.outStream;
    }
    disable() {
        this.running = false;
        this.outStream = null;
        Logger.user("Virtual background disabled");
        Logger.setStatus("Virtual background disabled");
    }
    getSourceStream() { return this.srcStream; }
    async loop() {
        while (this.running) {
            if (this.inVideo.readyState >= 2) {
                await this.seg.send({ image: this.inVideo });
            }
            await new Promise(r => setTimeout(r, 33));
        }
    }
    onResults(results) {
        const w = (results.image && results.image.width) || this.inVideo.videoWidth || 640;
        const h = (results.image && results.image.height) || this.inVideo.videoHeight || 480;
        if (!w || !h)
            return;
        if (this.canvas.width !== w)
            this.canvas.width = w;
        if (this.canvas.height !== h)
            this.canvas.height = h;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, w, h);
        // 1) Draw the camera frame
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(results.image, 0, 0, w, h);
        // 2) Keep ONLY the person using segmentation mask
        // segmentationMask: white = person, black = background
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(results.segmentationMask, 0, 0, w, h);
        // 3) Draw background BEHIND the person
        ctx.globalCompositeOperation = "destination-over";
        if (this.bg.complete && this.bg.naturalWidth > 0) {
            ctx.drawImage(this.bg, 0, 0, w, h);
        }
        else {
            // fallback: dark fill if image not loaded
            ctx.fillStyle = "#0b1020";
            ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = "source-over";
    }
}
class ScreenShareManager {
    constructor() {
        this.stream = null;
    }
    async start() {
        this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        return this.stream;
    }
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
    }
}
class NetworkQualityManager {
    constructor() {
        this.timer = null;
    }
    start(cb) {
        this.stop();
        this.timer = window.setInterval(() => {
            // synthetic values (replace with getStats wiring)
            const rtt = Math.round(APP_CONFIG.networkQuality.simulated.rttBaseMs +
                Math.random() * APP_CONFIG.networkQuality.simulated.rttSpreadMs);
            const jitter = Math.round(APP_CONFIG.networkQuality.simulated.jitterBaseMs +
                Math.random() * APP_CONFIG.networkQuality.simulated.jitterSpreadMs);
            const loss = Math.round(Math.random() * APP_CONFIG.networkQuality.simulated.lossMaxPct);
            const bitrate = Math.round(APP_CONFIG.networkQuality.simulated.bitrateBaseKbps +
                Math.random() * APP_CONFIG.networkQuality.simulated.bitrateSpreadKbps);
            const q = this.calc(rtt, jitter, loss, bitrate);
            const details = `rtt=${rtt}ms jitter=${jitter}ms loss=${loss}% bitrate=${bitrate}kbps`;
            cb(q, q, details);
        }, APP_CONFIG.networkQuality.sampleIntervalMs);
    }
    stop() {
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
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
        this.serverRetryAttempt = 0;
        this.serverRetryMax = 0;
        this.peerRetryAttempt = 0;
        this.peerRetryMax = 0;
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
    onServerRetrying(attempt, maxAttempts) {
        this.serverRetryAttempt = Math.max(0, attempt);
        this.serverRetryMax = Math.max(0, maxAttempts);
        this.transition("SERVER_RETRYING", true);
    }
    onPeerRetrying(attempt, maxAttempts) {
        this.peerRetryAttempt = Math.max(0, attempt);
        this.peerRetryMax = Math.max(0, maxAttempts);
        this.transition("PEER_RETRYING", true);
    }
    onFailed() {
        this.transition("FAILED", true);
    }
    onLeft() {
        this.transition("INIT", true);
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
    unregisterSubscriber(feedId) {
        this.subscriberPcs.delete(feedId);
        this.subscriberBytes.delete(feedId);
        this.subscriberIceStates.delete(feedId);
        this.subscriberConnStates.delete(feedId);
        this.remoteVideoTracksByFeed.delete(feedId);
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
            this.remoteMediaFlowAt = now;
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
                    .catch(() => { }));
            }
            for (const [feedId, pc] of this.subscriberPcs.entries()) {
                jobs.push(pc.getStats()
                    .then((report) => this.consumeSubscriberStats(feedId, report))
                    .catch(() => { }));
            }
            await Promise.all(jobs);
        }
        catch { }
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
        if (this.status.state === "SERVER_RETRYING" || this.status.state === "PEER_RETRYING") {
            return;
        }
        const now = Date.now();
        const hasRemote = this.remoteParticipantCount > 0;
        const localConnected = this.localIceState === "connected" || this.localIceState === "completed";
        const remoteConnected = Array.from(this.subscriberIceStates.values()).some(s => s === "connected" || s === "completed");
        const connectedIce = localConnected || remoteConnected;
        const mediaFlowing = this.remoteMediaFlowAt !== null && now - this.remoteMediaFlowAt <= APP_CONFIG.connectionStatus.mediaFlowRecentMs;
        const liveRemoteVideo = this.hasLiveRemoteVideoTrack();
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
            if (now - this.disconnectedSince > APP_CONFIG.connectionStatus.disconnectedRetryMs) {
                this.transition("RETRYING");
            }
            else {
                this.transition("DEGRADED");
            }
            return;
        }
        this.disconnectedSince = null;
        if ((connectedIce && (mediaFlowing || liveRemoteVideo)) || (hasRemote && liveRemoteVideo)) {
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
            this.transition(this.joinedAt ? "WAITING_REMOTE" : "NEGOTIATING");
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
        }
        if (nextStatus.state === "PEER_RETRYING" && this.peerRetryMax > 0) {
            nextStatus.secondaryText = `Retry ${this.peerRetryAttempt}/${this.peerRetryMax}. Recovering TURN/peer connection.`;
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
                Logger.setStatus("Janus initialized");
                Logger.user("Janus.init done");
            }
        });
    }
    /**
     * Creates Janus session.
     * IMPORTANT: pass iceServers from IMS payload.PC_CONFIG.iceServers
     */
    createSession(server, iceServers, ok, destroyed, onError) {
        Logger.setStatus("Creating Janus session...");
        Logger.user(`Creating Janus session: ${server}`);
        this.janus = new Janus({
            server,
            // ✅ TURN/STUN config (from IMS)
            // Janus will use these ICE servers for the underlying RTCPeerConnection(s)
            iceServers: iceServers ?? [],
            success: ok,
            error: (e) => {
                Logger.setStatus("Janus error: " + JSON.stringify(e));
                Logger.user("Janus session create error: " + JSON.stringify(e));
                onError?.(e);
            },
            destroyed: () => {
                Logger.user("Janus session destroyed");
                destroyed();
            }
        });
    }
    attachPublisher(onAttached, onMessage, onLocalTrack, onCleanup, onError) {
        if (!this.janus) {
            Logger.setStatus("Janus not ready");
            Logger.user("attachPublisher called but Janus session is null");
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
                Logger.setStatus("Attach error: " + JSON.stringify(e));
                Logger.user("Attach error: " + JSON.stringify(e));
                onError?.(e);
            },
            onmessage: (msg, jsep) => {
                onMessage(msg, jsep);
            },
            onlocaltrack: (track, on) => {
                onLocalTrack(track, on);
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
        catch { }
        this.publisher = null;
        try {
            this.janus?.destroy?.();
        }
        catch { }
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
    }
    addFeed(feedId) {
        if (this.feeds.has(feedId) || this.pendingFeedAttach.has(feedId))
            return;
        this.pendingFeedAttach.add(feedId);
        let remoteHandle = null;
        this.janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: (h) => {
                remoteHandle = h;
                this.pendingFeedAttach.delete(feedId);
                this.feeds.set(feedId, h);
                h.send({ message: { request: "join", room: this.roomId, ptype: "subscriber", feed: feedId, private_id: this.privateId } });
            },
            error: (e) => {
                this.pendingFeedAttach.delete(feedId);
                Logger.setStatus("Remote attach error: " + JSON.stringify(e));
            },
            onmessage: (msg, jsep) => {
                if (jsep) {
                    // TODO: If Janus internals change and webrtcStuff.pc is unavailable, pass the subscriber PC from a Janus plugin callback here.
                    const pc = remoteHandle?.webrtcStuff?.pc;
                    if (pc) {
                        this.observer?.onSubscriberPcReady?.(feedId, pc);
                    }
                    remoteHandle.createAnswer({
                        jsep,
                        tracks: [{ type: "audio", capture: false, recv: true }, { type: "video", capture: false, recv: true }],
                        success: (ans) => remoteHandle.send({ message: { request: "start", room: this.roomId }, jsep: ans }),
                        error: (e) => Logger.setStatus("Remote answer error: " + JSON.stringify(e))
                    });
                }
            },
            onlocaltrack: () => { },
            onremotetrack: (track, _mid, on) => {
                this.observer?.onRemoteTrackSignal?.(feedId, track, on);
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
            oncleanup: () => this.removeFeed(feedId, false, true)
        });
    }
    removeFeed(id, detach = true, notify = true) {
        this.pendingFeedAttach.delete(id);
        let removed = false;
        const h = this.feeds.get(id);
        if (h) {
            if (detach) {
                try {
                    h.detach();
                }
                catch { }
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
        Array.from(this.feeds.keys()).forEach(id => this.removeFeed(id, true, true));
        this.media.clearRemote(this.remoteVideo);
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
        // ✅ CLEAN recording state
        this.recording = false;
        this.currentRecordingId = null;
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
        this.gateway = new JanusGateway();
        this.media = new MediaManager();
        this.vbManager = new VirtualBackgroundManager();
        this.connectionEngine = new ConnectionStatusEngine((status) => {
            this.bus.emit("connection-status", status);
        });
        this.bus.emit("connection-status", this.connectionEngine.getStatus());
        this.gateway.init();
    }
    async join(cfg, opts) {
        this.activeJoinCfg = cfg;
        this.isLeaving = false;
        this.suppressPublisherCleanupRetry = false;
        if (!opts?.internalRetry) {
            this.serverRetryAttempt = 0;
            this.peerRetryAttempt = 0;
            this.clearRetryTimer();
        }
        this.connectionEngine.onJoinStarted();
        try {
            const server = UrlConfig.getVcxServer().server;
            const clientId = UrlConfig.getVcxServer().client_id;
            const http = new HttpClient(server, clientId);
            const ims = new ImsClient(http);
            const payload = await ims.getMediaConstraints();
            this.gateway.createSession(cfg.server, payload.PC_CONFIG?.iceServers, () => {
                this.connectionEngine.onSessionReady();
                this.attachAndEnsureRoomThenJoin(cfg);
            }, () => {
                this.connectionEngine.onSessionDestroyed();
                this.scheduleServerRetry("Janus session destroyed");
            }, (e) => {
                this.scheduleServerRetry(`Janus session create failed: ${JSON.stringify(e)}`);
            });
        }
        catch (e) {
            this.scheduleServerRetry("Join error: " + (e?.message || e));
        }
    }
    clearRetryTimer() {
        if (this.retryTimer !== null) {
            window.clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }
    cleanupForRetry() {
        this.remoteFeeds?.cleanupAll();
        this.remoteFeeds = null;
        this.plugin = null;
        this.stopParticipantSync();
        this.joinedRoom = false;
        this.roomCreateAttempted = false;
        this.privateId = null;
        this.selfId = null;
        this.roster.reset();
        this.bus.emit("joined", false);
        this.suppressPublisherCleanupRetry = true;
        this.gateway.destroy();
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
            this.connectionEngine.onFailed();
            if (kind === "server") {
                Logger.setStatus("Video server call failed. Retry limit reached.");
            }
            else {
                Logger.setStatus("TURN/peer connection failed. Retry limit reached.");
            }
            Logger.user(`[retry] ${kind} retries exhausted. reason=${reason}`);
            return;
        }
        if (kind === "server") {
            this.connectionEngine.onServerRetrying(attempt, maxAttempts);
            Logger.setStatus(`Video server call failed. Retrying (${attempt}/${maxAttempts})...`);
        }
        else {
            this.connectionEngine.onPeerRetrying(attempt, maxAttempts);
            Logger.setStatus(`TURN/peer connection failed. Retrying (${attempt}/${maxAttempts})...`);
        }
        Logger.user(`[retry] ${kind} scheduled (${attempt}/${maxAttempts}). reason=${reason}`);
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
            this.roster.reset();
            this.stopParticipantSync();
            // reset recording
            this.recording = false;
            this.currentRecordingId = null;
            this.bus.emit("recording-changed", false);
            this.connectionEngine.onPublisherAttached();
            Logger.setStatus("Plugin attached. Checking room...");
            this.ensureRoomThenJoin(cfg);
        }, (msg, jsep) => this.onPublisherMessage(cfg, msg, jsep), (track, on) => {
            if (on && track.kind === "video") {
                this.media.setLocalTrack(this.localVideo, track);
            }
        }, () => {
            if (this.isLeaving || this.suppressPublisherCleanupRetry)
                return;
            this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
            Logger.setStatus("Publisher cleanup. Recovering media connection...");
            this.schedulePeerRetry("Publisher cleanup");
        }, (e) => {
            this.scheduleServerRetry(`Attach publisher failed: ${JSON.stringify(e)}`);
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
                    Logger.setStatus(`Room exists. Joining...`);
                    this.sendPublisherJoin(cfg);
                }
                else {
                    Logger.setStatus(`Room not found. Creating...`);
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
        this.plugin.send({
            message: {
                request: "join",
                room: cfg.roomId,
                ptype: "publisher",
                display: cfg.display
            }
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
                description: `Room ${cfg.roomId}`
            },
            success: () => {
                Logger.setStatus("Room created. Joining...");
                this.sendPublisherJoin(cfg);
            },
            error: () => {
                this.scheduleServerRetry("Create room failed");
            }
        });
    }
    onPublisherMessage(cfg, msg, jsep) {
        if (msg?.janus === "hangup") {
            const reason = String(msg?.reason || "Peer hangup");
            if (reason.toLowerCase().includes("ice")) {
                this.schedulePeerRetry(`Publisher hangup: ${reason}`);
            }
            return;
        }
        const data = this.getVideoRoomData(msg);
        const event = data["videoroom"];
        const errorCode = data["error_code"];
        if (event === "event" && errorCode === 426) {
            if (!this.roomCreateAttempted) {
                this.roomCreateAttempted = true;
                this.sendCreateRoom(cfg);
            }
            else {
                this.connectionEngine.onFailed();
                this.leave();
            }
            return;
        }
        if (event === "joined") {
            this.joinedRoom = true;
            this.currentRoomId = cfg.roomId;
            this.serverRetryAttempt = 0;
            this.peerRetryAttempt = 0;
            this.clearRetryTimer();
            this.connectionEngine.onJoinedRoom();
            const myId = data["id"];
            this.privateId = data["private_id"];
            this.selfId = myId;
            this.roster.setSelf(myId);
            Logger.setStatus("Joined. Publishing...");
            this.remoteFeeds = new RemoteFeedManager(this.gateway.getJanus(), cfg.roomId, this.privateId, this.gateway.getOpaqueId(), this.media, this.remoteVideo, {
                onSubscriberPcReady: (feedId, pc) => {
                    this.connectionEngine.registerSubscriberPc(feedId, pc);
                },
                onRemoteTrackSignal: (feedId, track, on) => {
                    this.connectionEngine.onRemoteTrackSignal(feedId, track, on);
                },
                onRemoteFeedCleanup: (feedId) => {
                    this.connectionEngine.unregisterSubscriber(feedId);
                    if (this.remoteFeeds && this.roster.has(feedId) && feedId !== this.selfId) {
                        window.setTimeout(() => {
                            this.remoteFeeds?.addFeed(feedId);
                        }, APP_CONFIG.call.remoteFeedRetryDelayMs);
                    }
                }
            });
            this.publish();
            this.reconcile(cfg, data["publishers"]);
            this.bus.emit("joined", true);
            this.startParticipantSync(cfg);
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
        this.participantSyncTimer = window.setInterval(() => {
            this.syncParticipantsFromServer(cfg);
        }, APP_CONFIG.call.participantSyncIntervalMs);
    }
    stopParticipantSync() {
        if (this.participantSyncTimer !== null) {
            window.clearInterval(this.participantSyncTimer);
            this.participantSyncTimer = null;
        }
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
        this.plugin.send({
            message: { request: "listparticipants", room: cfg.roomId },
            success: (res) => {
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
            error: () => {
                this.participantSyncInFlight = false;
            }
        });
    }
    removeParticipant(cfg, feedId) {
        if (feedId === this.selfId)
            return;
        this.roster.remove(feedId);
        this.remoteFeeds?.removeFeed(feedId);
        this.publishParticipants(cfg);
    }
    // =====================================
    // MEDIA
    // =====================================
    getVideoConfig() {
        const cfg = UrlConfig.getVcxVideoConfig();
        const bitrateBps = Number.isFinite(cfg.bitrate_bps) ? Math.floor(cfg.bitrate_bps) : APP_CONFIG.media.bitrateBps;
        const maxFramerate = Number.isFinite(cfg.max_framerate) ? Math.floor(cfg.max_framerate) : APP_CONFIG.media.maxFramerate;
        return {
            bitrate_bps: Math.max(APP_CONFIG.media.minBitrateBps, Math.min(APP_CONFIG.media.maxBitrateBps, bitrateBps)),
            bitrate_cap: cfg.bitrate_cap !== false,
            max_framerate: Math.max(APP_CONFIG.media.minFramerate, Math.min(APP_CONFIG.media.maxFramerateCap, maxFramerate))
        };
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
                console.log("VCX_SET_PARAMETERS_ERROR=", e?.message || e);
            });
        }
        catch (e) {
            console.log("VCX_SET_PARAMETERS_HOOK_ERROR=", e?.message || e);
        }
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
    publish() {
        if (!this.plugin) {
            Logger.setStatus("Publish ignored: plugin not ready");
            return;
        }
        const videoCfg = this.getVideoConfig();
        this.plugin.createOffer({
            tracks: [
                { type: "audio", capture: true, recv: false },
                { type: "video", capture: true, recv: false },
            ],
            success: (jsep) => {
                // ✅ Point #4: capture and emit connectivity info from RTCPeerConnection
                try {
                    // TODO: If Janus internals change and webrtcStuff.pc is unavailable, bind the publisher PC from Janus plugin callbacks.
                    const pc = this.plugin?.webrtcStuff?.pc;
                    if (pc) {
                        this.connectionEngine.registerPublisherPc(pc);
                        this.tuneVideoSenderBitrate(pc, videoCfg.bitrate_bps, videoCfg.max_framerate);
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
                        pc.oniceconnectionstatechange = () => {
                            console.log("VCX_ICE=" + pc.iceConnectionState);
                            emit();
                            if (pc.iceConnectionState === "failed") {
                                this.schedulePeerRetry("Publisher ICE state failed");
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
                            if (pc.connectionState === "failed") {
                                this.schedulePeerRetry("Publisher connection state failed");
                            }
                        };
                        pc.onicegatheringstatechange = () => {
                            console.log("VCX_GATHERING=" + pc.iceGatheringState);
                            emit();
                        };
                    }
                    else {
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
                    console.log("VCX_CONNECTIVITY=hook_error", e?.message || e);
                }
                // ✅ normal Janus publish configure
                this.plugin.send({
                    message: {
                        request: "configure",
                        audio: true,
                        video: true,
                        bitrate: videoCfg.bitrate_bps,
                        bitrate_cap: videoCfg.bitrate_cap
                    },
                    jsep,
                });
            },
            error: (e) => {
                this.connectionEngine.onPeerRetrying(this.peerRetryAttempt + 1, APP_CONFIG.call.retry.peerMaxAttempts);
                Logger.setStatus("Offer error. Recovering media path...");
                console.log("VCX_OFFER_ERROR=", e);
                this.schedulePeerRetry("Offer error: " + JSON.stringify(e));
            },
        });
    }
    toggleMute() {
        if (!this.plugin)
            return;
        const m = this.plugin.isAudioMuted();
        m ? this.plugin.unmuteAudio() : this.plugin.muteAudio();
        this.bus.emit("mute-changed", !m);
    }
    markRetrying() {
        this.connectionEngine.onReconnect();
    }
    stopVideo() {
        this.plugin?.send({ message: { request: "unpublish" } });
    }
    // =====================================
    // RECORDING
    // =====================================
    startRecording(recordingId) {
        if (!this.plugin || !this.joinedRoom)
            return;
        if (this.recording)
            return;
        this.currentRecordingId = recordingId;
        this.plugin.send({
            message: {
                request: "configure",
                record: true,
                room: this.currentRoomId,
                filename: recordingId
            },
            success: () => {
                this.recording = true;
                Logger.setStatus(`Recording started: ${recordingId}`);
                this.bus.emit("recording-changed", true);
            },
            error: () => {
                this.recording = false;
                this.bus.emit("recording-changed", false);
            }
        });
    }
    stopRecording() {
        if (!this.plugin || !this.recording)
            return;
        this.plugin.send({
            message: { request: "configure", record: false },
            success: () => {
                this.recording = false;
                Logger.setStatus("Recording stopped");
                this.bus.emit("recording-changed", false);
            }
        });
    }
    // =====================================
    // LEAVE
    // =====================================
    leave() {
        try {
            this.isLeaving = true;
            this.clearRetryTimer();
            this.serverRetryAttempt = 0;
            this.peerRetryAttempt = 0;
            if (this.recording)
                this.stopRecording();
            try {
                if (this.joinedRoom) {
                    this.plugin?.send({ message: { request: "leave" } });
                }
            }
            catch { }
            this.remoteFeeds?.cleanupAll();
            this.remoteFeeds = null;
            this.plugin = null;
            this.suppressPublisherCleanupRetry = true;
            this.gateway.destroy();
            this.suppressPublisherCleanupRetry = false;
            this.stopParticipantSync();
            this.joinedRoom = false;
            this.recording = false;
            this.currentRecordingId = null;
            this.currentRoomId = null;
            this.activeJoinCfg = null;
            this.selfId = null;
            this.roster.reset();
            this.bus.emit("recording-changed", false);
            this.bus.emit("joined", false);
            this.connectionEngine.onLeft();
            this.media.clearLocal(this.localVideo);
            this.media.clearRemote(this.remoteVideo);
            Logger.setStatus("Left");
        }
        catch (e) {
            Logger.setStatus("Leave error: " + e.message);
        }
    }
    async toggleScreenShare() {
        if (!this.plugin)
            return;
        if (!this.screenEnabled) {
            const ss = await this.screenManager.start();
            const track = ss.getVideoTracks()[0];
            if (!track)
                return;
            this.screenEnabled = true;
            this.replaceVideoTrack(track);
            Logger.setStatus("Screen share started");
            this.bus.emit("screen-changed", true);
            track.onended = () => { if (this.screenEnabled)
                this.toggleScreenShare(); };
        }
        else {
            this.screenManager.stop();
            this.screenEnabled = false;
            const cam = await this.ensureCameraStream();
            const track = cam.getVideoTracks()[0];
            if (track)
                this.replaceVideoTrack(track);
            Logger.setStatus("Screen share stopped");
            this.bus.emit("screen-changed", false);
        }
    }
    async toggleVirtualBackground() {
        if (!this.plugin)
            return;
        if (this.screenEnabled) {
            Logger.setStatus("Disable screen share before virtual background");
            return;
        }
        if (!this.vbEnabled) {
            const cam = await this.ensureCameraStream();
            const processed = await this.vbManager.enable(cam);
            const track = processed.getVideoTracks()[0];
            if (!track)
                return;
            this.vbEnabled = true;
            this.replaceVideoTrack(track);
            this.bus.emit("vb-changed", true);
        }
        else {
            this.vbManager.disable();
            this.vbEnabled = false;
            const cam = await this.ensureCameraStream();
            const track = cam.getVideoTracks()[0];
            if (track)
                this.replaceVideoTrack(track);
            this.bus.emit("vb-changed", false);
        }
    }
    async ensureCameraStream() {
        if (!this.cameraStream) {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
        return this.cameraStream;
    }
    replaceVideoTrack(track) {
        if (!this.plugin)
            return;
        this.plugin.replaceTracks({
            tracks: [{ type: "video", capture: track, recv: false }]
        });
        this.media.setLocalTrack(this.localVideo, track);
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
        this.bridge = new ParentBridge();
        this.net = new NetworkQualityManager();
        this.remoteVideoEl = document.getElementById("remoteVideo");
        this.remoteFallback = document.getElementById("remoteFallback");
        this.localOverlay = document.getElementById("localOverlay");
        this.remoteOverlay = document.getElementById("remoteOverlay");
        this.endedOverlay = document.getElementById("endedOverlay");
        this.localQ = document.getElementById("localQuality");
        this.remoteQ = document.getElementById("remoteQuality");
        this.localQD = document.getElementById("localQualityDetails");
        this.remoteQD = document.getElementById("remoteQualityDetails");
        this.audioMuted = false;
        this.videoMuted = false;
        this.ended = false;
        this.folderPath = APP_CONFIG.recording.folderPath;
        this.autoRecordParticipantThreshold = APP_CONFIG.recording.autoStartParticipantThreshold;
        // ✅ recording state
        this.recording = false;
        this.connectionStatus = null;
        this.remoteVideoMonitorTimer = null;
        const qn = this.getQueryParam("name");
        if (qn)
            Logger.setUserName(qn);
        Logger.user("UI loaded. Initializing controllers...");
        Logger.flow("DOMContentLoaded → UIController()");
        this.logger = new Logger(document.getElementById("statusLine"), document.getElementById("sessionInfo"));
        const localVideo = document.getElementById("localVideo");
        const remoteVideo = this.remoteVideoEl;
        this.controller = new CallController(this.bus, localVideo, remoteVideo);
        this.bus.on("joined", j => {
            this.setJoinedState(j);
            console.log("VCX_JOINED=" + j);
            this.updateDebugState({
                joined: j
            });
        });
        this.bus.on("mute-changed", muted => {
            this.btnMute.innerHTML =
                muted
                    ? '<i class="fa-solid fa-microphone-slash"></i>'
                    : '<i class="fa-solid fa-microphone"></i>';
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
            Logger.user(`Participants count: ${count}`);
            // SIMPLE LOG (automation-friendly)
            console.log("VCX_PARTICIPANTS=" + count);
            this.updateDebugState({
                participants: count
            });
            this.syncAutoRecordingByParticipants(count);
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
        this.wire();
        this.setupNetworkUI();
        this.setupParentBridge();
        this.setupRemoteFallbackMonitor();
        this.autoJoin();
    }
    wire() {
        // AUDIO
        this.btnMute.onclick = () => {
            Logger.user("Audio button clicked → toggle mute");
            this.controller.toggleMute();
            this.audioMuted = !this.audioMuted;
            this.btnMute.classList.toggle("danger", this.audioMuted);
            this.applyConnectionOverlays();
            this.bridge.emit({ type: "AUDIO_MUTED", muted: this.audioMuted });
        };
        // VIDEO
        this.btnUnpublish.onclick = () => {
            Logger.user("Video button clicked");
            this.videoMuted = !this.videoMuted;
            this.btnUnpublish.classList.toggle("danger", this.videoMuted);
            if (this.videoMuted) {
                this.controller.stopVideo();
            }
            else {
                // republish
                this.controller.publish();
            }
            this.applyConnectionOverlays();
            this.bridge.emit({ type: "VIDEO_MUTED", muted: this.videoMuted });
        };
        // LEAVE / START
        this.btnLeave.onclick = () => {
            if (!this.ended) {
                Logger.user("End button clicked");
                this.controller.leave();
                this.ended = true;
                this.endedOverlay.style.display = "flex";
                this.renderRemoteFallback();
                this.btnLeave.innerHTML =
                    '<i class="fa-solid fa-play"></i>';
                this.btnLeave.title = "Start";
                this.bridge.emit({ type: "CALL_ENDED" });
            }
            else {
                Logger.user("Start button clicked");
                this.autoJoin();
            }
        };
        this.btnReconnect.onclick = () => this.reconnect();
        this.btnScreen.onclick =
            () => this.controller.toggleScreenShare();
        this.btnVB.onclick =
            () => this.controller.toggleVirtualBackground();
        // ✅ RECORD BUTTON
        if (this.btnRecord) {
            this.btnRecord.onclick = () => {
                if (this.recording) {
                    this.stopRecording("manual");
                }
                else {
                    this.startRecording("manual");
                }
            };
        }
    }
    syncAutoRecordingByParticipants(participantCount) {
        const shouldRecord = participantCount >= this.autoRecordParticipantThreshold;
        if (shouldRecord && !this.recording) {
            this.startRecording("auto");
            return;
        }
        if (!shouldRecord && this.recording) {
            this.stopRecording("auto");
        }
    }
    startRecording(source) {
        if (this.recording)
            return;
        const rid = this.createRecordingId();
        Logger.user(`${source} start recording`);
        this.controller.startRecording(rid);
    }
    stopRecording(source) {
        if (!this.recording)
            return;
        Logger.user(`${source} stop recording`);
        this.controller.stopRecording();
    }
    createRecordingId() {
        // Generate 6 digit integer (100000 – 999999)
        const recordingId = Math.floor(100000 + Math.random() * 900000);
        // Build Janus recording basename
        const rid = `${this.folderPath}/${recordingId}/rec_${Date.now()}`;
        Logger.user(`Recording generated → id=${recordingId}, rid=${rid}`);
        return rid;
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
    autoJoin() {
        const cfg = UrlConfig.buildJoinConfig();
        this.lastCfg = cfg;
        this.recording = false;
        this.updateRecordUI();
        Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}`);
        this.ended = false;
        this.endedOverlay.style.display = "none";
        this.renderRemoteFallback();
        this.btnLeave.innerHTML =
            '<i class="fa-solid fa-phone-slash"></i>';
        this.btnLeave.title = "End";
        this.controller.join(cfg);
        this.bridge.emit({ type: "CALL_STARTED" });
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
            this.btnLeave,
            this.btnReconnect,
            this.btnScreen,
            this.btnVB,
            this.btnRecord
        ].forEach(b => b && (b.disabled = !joined));
    }
    getLocalBaseOverlayText() {
        if (this.videoMuted)
            return "video muted";
        if (this.audioMuted)
            return "audio muted";
        return "Local";
    }
    getRemoteBaseOverlayText() {
        if (this.videoMuted)
            return "video muted on other participant";
        if (this.audioMuted)
            return "audio muted on other participant";
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
        this.connectionStatus = status;
        this.logger.setStatus(status.primaryText);
        this.logger.setInfo(status.secondaryText);
        this.applyConnectionOverlays();
        this.renderRemoteFallback();
        this.updateDebugState({
            connectionOwner: status.owner,
            connectionSeverity: status.severity,
            connectionState: status.state
        });
    }
    setupRemoteFallbackMonitor() {
        const refresh = () => this.renderRemoteFallback();
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
    hasRemoteVideoTrack() {
        const ms = this.remoteVideoEl.srcObject;
        if (!ms)
            return false;
        const tracks = ms.getVideoTracks();
        if (!tracks || tracks.length === 0)
            return false;
        return tracks.some(t => t.readyState === "live" && t.enabled !== false);
    }
    renderRemoteFallback() {
        if (!this.remoteFallback)
            return;
        const showFallback = !this.ended && !this.hasRemoteVideoTrack();
        this.remoteFallback.style.display = showFallback ? "flex" : "none";
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
        });
    }
    setupParentBridge() {
        this.bridge.onCommand((cmd) => {
            switch (cmd.type) {
                case "START_CALL":
                    this.controller.join(this.lastCfg);
                    break;
                case "STOP_CALL":
                    this.controller.leave();
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
                    this.startRecording("manual");
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