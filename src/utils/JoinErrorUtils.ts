class JoinErrorUtils {
  static parseErrorCode(errorCodeRaw: unknown): number | null {
    const code = Number(errorCodeRaw);
    return Number.isFinite(code) ? code : null;
  }

  static extractErrorText(data: any): string {
    return String(data?.error || data?.error_reason || data?.reason || "").trim();
  }

  static isParticipantIdCollisionError(errorCode: number | null, errorText: string): boolean {
    const lower = errorText.toLowerCase();
    if (errorCode === ErrorCodes.JANUS_PARTICIPANT_ID_COLLISION) return true;
    return lower.includes("id") &&
      (lower.includes("exists") || lower.includes("exist") || lower.includes("already") || lower.includes("taken"));
  }

  static isUnauthorizedJoinError(errorCode: number | null, errorText: string): boolean {
    const lower = errorText.toLowerCase();
    return lower.includes("unauthor") ||
      lower.includes("forbidden") ||
      errorCode === ErrorCodes.JANUS_UNAUTHORIZED ||
      errorCode === ErrorCodes.JANUS_FORBIDDEN;
  }

  static isRoomMissingError(errorText: string): boolean {
    const lower = errorText.toLowerCase();
    return lower.includes("no such room") || lower.includes("room not found");
  }
}

class ApiErrorUtils {
  private static safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  private static collectErrorText(err: unknown): string {
    const e = err as any;
    return [
      String(e?.message || ""),
      String(e?.error || ""),
      String(e?.reason || ""),
      String(e?.statusText || ""),
      this.safeStringify(e?.details),
      this.safeStringify(e?.data),
      this.safeStringify(e?.response),
      this.safeStringify(err)
    ]
      .join(" ")
      .toLowerCase();
  }

  static isUnauthorized(err: unknown): boolean {
    const status = Number((err as any)?.status);
    if (status === 401) return true;
    const message = this.collectErrorText(err);
    return message.includes("http 401") || message.includes("unauthor");
  }

  static isOffline(err: unknown): boolean {
    if (navigator.onLine === false) return true;
    const status = Number((err as any)?.status);
    const message = this.collectErrorText(err);
    const isClientTimeout = status === 408 && message.includes("timeout (");
    if (status === 0 || isClientTimeout) return true;
    const offlineTokens = [
      "failed to fetch",
      "network error",
      "networkerror",
      "network request failed",
      "internet disconnected",
      "offline",
      "err_internet_disconnected",
      "err_network_changed",
      "err_name_not_resolved",
      "err_connection_refused",
      "err_connection_reset",
      "err_connection_timed_out",
      "err_address_unreachable",
      "the internet connection appears to be offline",
      "load failed"
    ];
    return offlineTokens.some((token) => message.includes(token));
  }

  static resolveUserFacingErrorMessage(err: unknown): string {
    return this.isOffline(err)
      ? ErrorMessages.NETWORK_OFFLINE
      : ErrorMessages.INTERNAL_SERVER_ERROR_RETRY_LATER;
  }

  static resolveLoginUrl(): string {
    const qs = new URLSearchParams(window.location.search);
    const loginUrl =
      qs.get("loginUrl") ||
      qs.get("login_url") ||
      "";
    return loginUrl.trim() || "/login";
  }

  static handle(err: unknown): void {
    if (this.isUnauthorized(err)) {
      window.location.assign(this.resolveLoginUrl());
      return;
    }
    const message = this.resolveUserFacingErrorMessage(err);
    Logger.setStatus(message);
    Logger.error(message, err);
  }
}
