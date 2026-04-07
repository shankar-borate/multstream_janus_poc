class Logger {
  static instance: Logger | null = null;
  private static readonly STATUS_COLOR_DEFAULT = "#111827";
  private static readonly STATUS_COLOR_WARN = "#d97706";
  private static readonly STATUS_COLOR_ERROR = "#dc2626";
  private static readonly messageListeners = new Set<(entry: CallMessageEntry) => void>();

  private static userName = "User";
  private static remoteName = "Remote";
  private static level: LogLevel = APP_CONFIG.logging.level;
  private static readonly LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: 50
  };

  constructor(
    private statusEl?: HTMLElement,
    private infoEl?: HTMLElement
  ){
    Logger.instance = this;
  }

  static setUserName(name: string): void {
    Logger.userName = (name && name.trim()) ? name.trim() : "User";
    Logger.user(`Display name set to ${Logger.userName}`);
  }

  static setRemoteName(name: string): void {
    Logger.remoteName = (name && name.trim()) ? name.trim() : "Remote";
    Logger.remote(`Remote name set`);
  }

  static setLevel(level: LogLevel): void {
    Logger.level = level;
  }

  static onMessage(listener: (entry: CallMessageEntry) => void): () => void {
    Logger.messageListeners.add(listener);
    return () => {
      Logger.messageListeners.delete(listener);
    };
  }

  private static canLog(level: LogLevel): boolean {
    return Logger.LEVEL_PRIORITY[level] >= Logger.LEVEL_PRIORITY[Logger.level];
  }

  private static emitMessage(severity: CallMessageSeverity, msg: string): void {
    const message = String(msg ?? "").trim();
    if (!message) return;
    const entry: CallMessageEntry = {
      message,
      severity,
      ts: Date.now(),
      source: "local",
      sourceLabel: null
    };
    Logger.messageListeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private static writeStatus(statusEl: HTMLElement | undefined, msg: string, color: string): void {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = color;
  }

  private writeInfo(msg: string): void {
    if (this.infoEl) this.infoEl.textContent = msg;
  }

  // Instance UI updates
  setStatus(msg: string): void {
    Logger.writeStatus(this.statusEl, msg, Logger.STATUS_COLOR_DEFAULT);
    Logger.user(msg);
  }

  setInfo(msg: string): void {
    this.writeInfo(msg);
    if (msg) {
      Logger.emitMessage("info", msg);
      Logger.flow(msg);
    }
  }

  private setErrorStatus(msg: string): void {
    Logger.writeStatus(this.statusEl, msg, Logger.STATUS_COLOR_ERROR);
    Logger.logError(msg);
  }

  private setWarnStatus(msg: string): void {
    Logger.writeStatus(this.statusEl, msg, Logger.STATUS_COLOR_WARN);
    Logger.logWarn(msg);
  }

  setStatusBySeverity(msg: string, severity: "info" | "warn" | "error"): void {
    if (severity === "error") {
      this.setErrorStatus(msg);
      return;
    }
    if (severity === "warn") {
      this.setWarnStatus(msg);
      return;
    }
    this.setStatus(msg);
  }

  // Static UI updates (backward compatible)
  static setStatus(msg: string): void {
    if (Logger.instance) {
      Logger.instance.setStatus(msg);
      return;
    }
    Logger.user(msg);
  }
  static setInfo(msg: string): void {
    if (Logger.instance) {
      Logger.instance.setInfo(msg);
      return;
    }
    Logger.flow(msg);
  }
  static setStatusBySeverity(msg: string, severity: "info" | "warn" | "error"): void {
    if (Logger.instance) {
      Logger.instance.setStatusBySeverity(msg, severity);
      return;
    }
    if (severity === "error") {
      Logger.error(msg);
      return;
    }
    if (severity === "warn") {
      Logger.warn(msg);
      return;
    }
    Logger.setStatus(msg);
  }
  static info(msg: string): void { Logger.setInfo(msg); }
  static warn(msg: string): void {
    if (Logger.instance) {
      Logger.writeStatus(Logger.instance.statusEl, msg, Logger.STATUS_COLOR_WARN);
    }
    Logger.logWarn(msg);
  }
  static error(msg: string, err?: unknown): void {
    if (Logger.instance) {
      Logger.writeStatus(Logger.instance.statusEl, msg, Logger.STATUS_COLOR_ERROR);
    }
    Logger.logError(msg, err);
  }

  // Friendly narration logs
  static user(msg: string, data?: any): void {
    Logger.emitMessage("info", msg);
    if (!Logger.canLog("info")) return;
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#22c55e;font-weight:bold", data ?? "");
  }
  static remote(msg: string, data?: any): void {
    Logger.emitMessage("info", msg);
    if (!Logger.canLog("info")) return;
    console.log(`%cRemote(${Logger.remoteName}): ${msg}`, "color:#60a5fa;font-weight:bold", data ?? "");
  }
  static net(msg: string, data?: any): void {
    if (!Logger.canLog("debug")) return;
    console.log(`%cNet: ${msg}`, "color:#f59e0b;font-weight:bold", data ?? "");
  }
  static flow(msg: string, data?: any): void {
    if (!Logger.canLog("debug")) return;
    console.log(`%cFlow: ${msg}`, "color:#a78bfa;font-weight:bold", data ?? "");
  }

  private static logWarn(msg: string): void {
    Logger.emitMessage("warn", msg);
    if (!Logger.canLog("warn")) return;
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#f59e0b;font-weight:bold");
  }

  private static logError(msg: string, err?: unknown): void {
    Logger.emitMessage("error", msg);
    if (!Logger.canLog("error")) return;
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#fb7185;font-weight:bold");
    if (err) console.error(err);
  }
}
