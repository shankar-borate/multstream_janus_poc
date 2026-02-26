class Logger {
  static instance: Logger | null = null;
  private static readonly STATUS_COLOR_DEFAULT = "#111827";
  private static readonly STATUS_COLOR_ERROR = "#dc2626";

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

  private static canLog(level: LogLevel): boolean {
    return Logger.LEVEL_PRIORITY[level] >= Logger.LEVEL_PRIORITY[Logger.level];
  }

  // Instance UI updates
  setStatus(msg: string): void {
    if (this.statusEl) {
      this.statusEl.textContent = msg;
      this.statusEl.style.color = Logger.STATUS_COLOR_DEFAULT;
    }
    Logger.user(msg);
  }

  setInfo(msg: string): void {
    if (this.infoEl) this.infoEl.textContent = msg;
    if (msg) Logger.flow(msg);
  }

  private setErrorStatus(msg: string): void {
    if (this.statusEl) {
      this.statusEl.textContent = msg;
      this.statusEl.style.color = Logger.STATUS_COLOR_ERROR;
    }
    Logger.user(msg);
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
  static info(msg: string): void { Logger.setInfo(msg); }
  static warn(msg: string): void {
    if (!Logger.canLog("warn")) return;
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#f59e0b;font-weight:bold");
  }
  static error(msg: string, err?: unknown): void {
    if (!Logger.canLog("error")) return;
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#fb7185;font-weight:bold");
    if (err) console.error(err);
    if (Logger.instance) {
      Logger.instance.setErrorStatus(msg);
      return;
    }
    Logger.user(msg);
  }

  // Friendly narration logs
  static user(msg: string, data?: any): void {
    if (!Logger.canLog("info")) return;
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#22c55e;font-weight:bold", data ?? "");
  }
  static remote(msg: string, data?: any): void {
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
}
