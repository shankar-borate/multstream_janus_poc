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
  static isUnauthorized(err: unknown): boolean {
    const status = Number((err as any)?.status);
    if (status === 401) return true;
    const message = String((err as any)?.message || "").toLowerCase();
    return message.includes("http 401") || message.includes("unauthor");
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
    Logger.error(ErrorMessages.INTERNAL_SERVER_ERROR_RETRY_LATER, err);
  }
}
