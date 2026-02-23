interface ImsSettingRow {
  name: string;
  /** JSON string */
  value: string;
}

/** Parsed payload inside `value` */
interface MediaConstraintsPayload {
  MEDIA_CONSTRAINTS?: {
    WEB_MEDIA_CONSTRAINTS?: any[];
    WEB_MEDIA_CONSTRAINTS_GU?: any[];
    MOBILE_MEDIA_CONSTRAINTS?: any[];
  };
  PC_CONFIG?: RTCConfiguration;
  PC_CONFIG_FF?: any;
  videochat?: any;
  chimeMediaConstraints?: any;
}

/**
 * Pick best constraint object for browser/device.
 * You can tweak strategy later (e.g., based on isMobile, isSafari, bandwidth, etc.)
 */
function pickMediaConstraints(payload: MediaConstraintsPayload, isMobile: boolean): MediaStreamConstraints {
  const mc = payload.MEDIA_CONSTRAINTS ?? {};
  if (isMobile) {
    const list = mc.MOBILE_MEDIA_CONSTRAINTS ?? [];
    return (list[0] as MediaStreamConstraints) ?? { audio: true, video: true };
  }
  const list = mc.WEB_MEDIA_CONSTRAINTS ?? [];
  return (list[0] as MediaStreamConstraints) ?? { audio: true, video: true };
}
