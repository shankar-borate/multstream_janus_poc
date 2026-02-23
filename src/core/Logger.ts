class Logger {
  static instance: Logger | null = null;

  private static userName = "User";
  private static remoteName = "Remote";

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

  // Instance UI updates
  setStatus(msg: string): void {
    if (this.statusEl) this.statusEl.textContent = msg;
    Logger.user(msg);
  }

  setInfo(msg: string): void {
    if (this.infoEl) this.infoEl.textContent = msg;
    if (msg) Logger.flow(msg);
  }

  // Static UI updates (backward compatible)
  static setStatus(msg: string): void { Logger.instance?.setStatus(msg); Logger.user(msg); }
  static setInfo(msg: string): void { Logger.instance?.setInfo(msg); Logger.flow(msg); }
  static info(msg: string): void { Logger.setInfo(msg); }
  static warn(msg: string): void { console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#f59e0b;font-weight:bold"); }
  static error(msg: string, err?: unknown): void {
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#fb7185;font-weight:bold");
    if (err) console.error(err);
  }

  // Friendly narration logs
  static user(msg: string, data?: any): void {
    console.log(`%cUser(${Logger.userName}): ${msg}`, "color:#22c55e;font-weight:bold", data ?? "");
  }
  static remote(msg: string, data?: any): void {
    console.log(`%cRemote(${Logger.remoteName}): ${msg}`, "color:#60a5fa;font-weight:bold", data ?? "");
  }
  static net(msg: string, data?: any): void {
    console.log(`%cNet: ${msg}`, "color:#f59e0b;font-weight:bold", data ?? "");
  }
  static flow(msg: string, data?: any): void {
    console.log(`%cFlow: ${msg}`, "color:#a78bfa;font-weight:bold", data ?? "");
  }
}
