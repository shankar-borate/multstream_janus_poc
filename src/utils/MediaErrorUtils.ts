type PublishErrorClassification = { userMessage: string; retryable: boolean };

class MediaErrorUtils {
  static getErrorName(err: unknown): string {
    const anyErr = err as any;
    return String(anyErr?.name || anyErr?.error?.name || "").trim();
  }

  static getErrorMessage(err: unknown): string {
    const anyErr = err as any;
    return String(anyErr?.message || anyErr?.error?.message || "").trim();
  }

  static isMediaPermissionError(err: unknown): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "notallowederror" ||
      name === "permissiondeniederror" ||
      name === "securityerror" ||
      /permission|denied|not allowed/.test(msg);
  }

  static isMediaDeviceMissingError(err: unknown): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "notfounderror" ||
      name === "devicesnotfounderror" ||
      /requested device not found|notfound/.test(msg);
  }

  static isMediaBusyError(err: unknown): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "notreadableerror" ||
      name === "trackstarterror" ||
      /device in use|device is busy|could not start video source/.test(msg);
  }

  static isMediaConstraintError(err: unknown): boolean {
    const name = this.getErrorName(err).toLowerCase();
    const msg = this.getErrorMessage(err).toLowerCase();
    return name === "overconstrainederror" ||
      name === "constraintnotsatisfiederror" ||
      /overconstrained|constraint/.test(msg);
  }

  static getCameraMicErrorMessage(err: unknown): string {
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

  static getScreenShareErrorMessage(err: unknown): string {
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

  static classifyPublishError(err: unknown): PublishErrorClassification {
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
