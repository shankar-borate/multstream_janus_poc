"use strict";
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
    static setStatus(msg) { Logger.instance?.setStatus(msg); Logger.user(msg); }
    static setInfo(msg) { Logger.instance?.setInfo(msg); Logger.flow(msg); }
    static info(msg) { Logger.setInfo(msg); }
    static warn(msg) { console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#f59e0b;font-weight:bold"); }
    static error(msg, err) {
        console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#fb7185;font-weight:bold");
        if (err)
            console.error(err);
    }
    // Friendly narration logs
    static user(msg, data) {
        console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#22c55e;font-weight:bold", data ?? "");
    }
    static remote(msg, data) {
        console.log(`%cRemote(${Logger.remoteName}): ${msg}`, "color:#60a5fa;font-weight:bold", data ?? "");
    }
    static net(msg, data) {
        console.log(`%cNet: ${msg}`, "color:#f59e0b;font-weight:bold", data ?? "");
    }
    static flow(msg, data) {
        console.log(`%cFlow: ${msg}`, "color:#a78bfa;font-weight:bold", data ?? "");
    }
}
Logger.instance = null;
Logger.userName = "User";
Logger.remoteName = "Remote";
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
            server: "https://localhost.beta.videocx.io",
            client_id: "101"
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
            server: this.getString("server", "wss://localhost.beta.videocx.io/mstream_janus"),
            roomId,
            display: this.getString("name", "Guest")
        };
    }
}
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
    constructor(baseUrl, clientId, defaultTimeoutMs = 15000) {
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
        const res = await this.http.getJson("/ims/users/media-constraints");
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
        ms.addTrack(track);
        video.srcObject = ms;
        video.play().catch(() => { });
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
            const rtt = Math.round(30 + Math.random() * 200);
            const jitter = Math.round(3 + Math.random() * 60);
            const loss = Math.round(Math.random() * 8);
            const bitrate = Math.round(150 + Math.random() * 1000);
            const q = this.calc(rtt, jitter, loss, bitrate);
            const details = `rtt=${rtt}ms jitter=${jitter}ms loss=${loss}% bitrate=${bitrate}kbps`;
            cb(q, q, details);
        }, 3000);
    }
    stop() {
        if (this.timer != null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    calc(rtt, jitter, loss, bitrate) {
        let score = 0;
        if (rtt < 120)
            score++;
        if (jitter < 30)
            score++;
        if (loss < 2)
            score++;
        if (bitrate > 400)
            score++;
        if (score >= 4)
            return "High";
        if (score >= 2)
            return "Medium";
        return "Low";
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
            debug: "all",
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
    createSession(server, iceServers, ok, destroyed) {
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
            },
            destroyed: () => {
                Logger.user("Janus session destroyed");
                destroyed();
            }
        });
    }
    attachPublisher(onAttached, onMessage, onLocalTrack, onCleanup) {
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
/*class JanusGateway {
  private janus:any = null;
  private publisher:any = null;
  private opaqueId = "videocx-ui-" + Janus.randomString(12);

  constructor(){}

  init(){
    Janus.init({ debug:"all", callback: ()=>Logger.setStatus("Janus initialized") });
  }

  createSession(server:string, ok:()=>void, destroyed:()=>void){
    Logger.setStatus("Creating Janus session...");
    Logger.user(`Creating Janus session: ${server}`);
      this.janus = new Janus({
      server,
      success: ok,
      error: (e:any)=>Logger.setStatus("Janus error: "+JSON.stringify(e)),
      destroyed
    });
  }

  attachPublisher(
    onAttached:(h:any)=>void,
    onMessage:(msg:any,jsep:any)=>void,
    onLocalTrack:(track:MediaStreamTrack,on:boolean)=>void,
    onCleanup:()=>void
  ){
    this.janus.attach({
      plugin:"janus.plugin.videoroom",
      opaqueId:this.opaqueId,
      success:(h:any)=>{ this.publisher=h; onAttached(h); },
      error:(e:any)=>Logger.setStatus("Attach error: "+JSON.stringify(e)),
      onmessage:onMessage,
      onlocaltrack:onLocalTrack,
      oncleanup:onCleanup
    });
  }

  getJanus(){ return this.janus; }
  getOpaqueId(){ return this.opaqueId; }

  destroy(){
    try{ this.publisher?.detach(); }catch{}
    this.publisher = null;
    try{ this.janus?.destroy(); }catch{}
    this.janus = null;
  }
}*/
class RemoteFeedManager {
    constructor(janus, roomId, privateId, opaqueId, media, remoteVideo) {
        this.janus = janus;
        this.roomId = roomId;
        this.privateId = privateId;
        this.opaqueId = opaqueId;
        this.media = media;
        this.remoteVideo = remoteVideo;
        this.feeds = new Map();
    }
    addFeed(feedId) {
        if (this.feeds.has(feedId))
            return;
        let remoteHandle = null;
        this.janus.attach({
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: (h) => {
                remoteHandle = h;
                this.feeds.set(feedId, h);
                h.send({ message: { request: "join", room: this.roomId, ptype: "subscriber", feed: feedId, private_id: this.privateId } });
            },
            error: (e) => Logger.setStatus("Remote attach error: " + JSON.stringify(e)),
            onmessage: (msg, jsep) => {
                if (jsep) {
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
                if (!on)
                    return;
                this.media.setRemoteTrack(this.remoteVideo, track);
            },
            oncleanup: () => this.removeFeed(feedId)
        });
    }
    removeFeed(id) {
        const h = this.feeds.get(id);
        if (h) {
            try {
                h.detach();
            }
            catch { }
            this.feeds.delete(id);
        }
    }
    cleanupAll() {
        this.feeds.forEach(h => { try {
            h.detach();
        }
        catch { } });
        this.feeds.clear();
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
        this.gateway = new JanusGateway();
        this.media = new MediaManager();
        this.vbManager = new VirtualBackgroundManager();
        this.gateway.init();
    }
    async join(cfg) {
        const server = UrlConfig.getVcxServer().server;
        const clientId = UrlConfig.getVcxServer().client_id;
        const http = new HttpClient(server, clientId);
        const ims = new ImsClient(http);
        const payload = await ims.getMediaConstraints();
        this.gateway.createSession(cfg.server, payload.PC_CONFIG?.iceServers, () => this.attachAndEnsureRoomThenJoin(cfg), () => Logger.setStatus("Session destroyed"));
    }
    attachAndEnsureRoomThenJoin(cfg) {
        this.gateway.attachPublisher((h) => {
            this.plugin = h;
            this.joinedRoom = false;
            this.roomCreateAttempted = false;
            this.selfId = null;
            this.roster.reset();
            // reset recording
            this.recording = false;
            this.currentRecordingId = null;
            this.bus.emit("recording-changed", false);
            Logger.setStatus("Plugin attached. Checking room...");
            this.ensureRoomThenJoin(cfg);
        }, (msg, jsep) => this.onPublisherMessage(cfg, msg, jsep), (track, on) => {
            if (on && track.kind === "video") {
                this.media.setLocalTrack(this.localVideo, track);
            }
        }, () => Logger.setStatus("Publisher cleanup"));
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
            error: () => this.leave()
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
                publishers: 10,
                description: `Room ${cfg.roomId}`
            },
            success: () => {
                Logger.setStatus("Room created. Joining...");
                this.sendPublisherJoin(cfg);
            },
            error: () => this.leave()
        });
    }
    onPublisherMessage(cfg, msg, jsep) {
        const data = this.getVideoRoomData(msg);
        const event = data["videoroom"];
        const errorCode = data["error_code"];
        if (event === "event" && errorCode === 426) {
            if (!this.roomCreateAttempted) {
                this.roomCreateAttempted = true;
                this.sendCreateRoom(cfg);
            }
            else {
                this.leave();
            }
            return;
        }
        if (event === "joined") {
            this.joinedRoom = true;
            this.currentRoomId = cfg.roomId;
            const myId = data["id"];
            this.privateId = data["private_id"];
            this.selfId = myId;
            this.roster.setSelf(myId);
            Logger.setStatus("Joined. Publishing...");
            this.remoteFeeds = new RemoteFeedManager(this.gateway.getJanus(), cfg.roomId, this.privateId, this.gateway.getOpaqueId(), this.media, this.remoteVideo);
            this.publish();
            this.reconcile(cfg, data["publishers"]);
            this.bus.emit("joined", true);
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
        }
        if (event === "destroyed") {
            this.leave();
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
                this.remoteFeeds.addFeed(feedId);
            }
        });
        this.bus.emit("participants", this.roster.snapshot(cfg.roomId));
    }
    removeParticipant(cfg, feedId) {
        if (feedId === this.selfId)
            return;
        this.roster.remove(feedId);
        this.remoteFeeds?.removeFeed(feedId);
        this.bus.emit("participants", this.roster.snapshot(cfg.roomId));
    }
    // =====================================
    // MEDIA
    // =====================================
    publish() {
        this.plugin.createOffer({
            tracks: [
                { type: "audio", capture: true, recv: false },
                { type: "video", capture: true, recv: false }
            ],
            success: (jsep) => {
                this.plugin.send({
                    message: { request: "configure", audio: true, video: true },
                    jsep
                });
            }
        });
    }
    toggleMute() {
        if (!this.plugin)
            return;
        const m = this.plugin.isAudioMuted();
        m ? this.plugin.unmuteAudio() : this.plugin.muteAudio();
        this.bus.emit("mute-changed", !m);
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
            this.gateway.destroy();
            this.joinedRoom = false;
            this.recording = false;
            this.currentRecordingId = null;
            this.currentRoomId = null;
            this.selfId = null;
            this.roster.reset();
            this.bus.emit("recording-changed", false);
            this.bus.emit("joined", false);
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
        this.folderPath = "/opt/efs-janus-app/dev/VideoRecDownloads";
        // ✅ recording state
        this.recording = false;
        const qn = this.getQueryParam("name");
        if (qn)
            Logger.setUserName(qn);
        Logger.user("UI loaded. Initializing controllers...");
        Logger.flow("DOMContentLoaded → UIController()");
        this.logger = new Logger(document.getElementById("statusLine"), document.getElementById("sessionInfo"));
        const localVideo = document.getElementById("localVideo");
        const remoteVideo = document.getElementById("remoteVideo");
        this.controller = new CallController(this.bus, localVideo, remoteVideo);
        this.bus.on("joined", j => this.setJoinedState(j));
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
        this.wire();
        this.setupNetworkUI();
        this.setupParentBridge();
        this.autoJoin();
    }
    wire() {
        // AUDIO
        this.btnMute.onclick = () => {
            Logger.user("Audio button clicked → toggle mute");
            this.controller.toggleMute();
            this.audioMuted = !this.audioMuted;
            this.btnMute.classList.toggle("danger", this.audioMuted);
            this.localOverlay.innerText =
                this.audioMuted ? "audio muted" : "Local";
            this.remoteOverlay.innerText =
                this.audioMuted
                    ? "audio muted on other participant"
                    : "Remote";
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
            this.localOverlay.innerText =
                this.videoMuted ? "video muted" : "Local";
            this.remoteOverlay.innerText =
                this.videoMuted
                    ? "video muted on other participant"
                    : "Remote";
            this.bridge.emit({ type: "VIDEO_MUTED", muted: this.videoMuted });
        };
        // LEAVE / START
        this.btnLeave.onclick = () => {
            if (!this.ended) {
                Logger.user("End button clicked");
                this.controller.leave();
                this.ended = true;
                this.endedOverlay.style.display = "flex";
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
                this.recording = !this.recording;
                this.updateRecordUI();
                if (this.recording) {
                    //const rid = this.folderPath+"rec_" + Date.now();
                    const rid = this.createRecordingId();
                    Logger.user("start recording");
                    this.controller.startRecording(rid);
                }
                else {
                    Logger.user("stop recording");
                    this.controller.stopRecording();
                }
                this.bridge.emit({
                    type: "RECORDING_CHANGED",
                    recording: this.recording
                });
            };
        }
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
        Logger.setStatus(`Joining... roomId=${cfg.roomId}, name=${cfg.display}`);
        this.ended = false;
        this.endedOverlay.style.display = "none";
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
        // safer Janus reconnect
        setTimeout(() => {
            this.controller.join(this.lastCfg);
        }, 800);
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
                    if (!this.recording)
                        this.btnRecord.click();
                    break;
                case "STOP_RECORDING":
                    if (this.recording)
                        this.btnRecord.click();
                    break;
                case "TOGGLE_RECORDING":
                    this.btnRecord.click();
                    break;
            }
        });
    }
}
// src/app.ts
// import {UIController} from "./ui/UIController";
window.addEventListener("DOMContentLoaded", () => {
    console.log("page loaded");
    new UIController();
});
//# sourceMappingURL=app.js.map