class CodecSupportUtil {
  private static normalizeCodec(raw: unknown): "vp8" | "vp9" | null {
    const normalized = String(raw ?? "").trim().toLowerCase();
    if (normalized === "vp8" || normalized === "vp9") return normalized;
    return null;
  }

  static getConfiguredVideoCodecOrder(): Array<"vp8" | "vp9"> {
    const configured = Array.isArray(APP_CONFIG.media.videoCodecPreferenceOrder)
      ? APP_CONFIG.media.videoCodecPreferenceOrder
      : ["vp9", "vp8"];

    const order: Array<"vp8" | "vp9"> = [];
    configured.forEach((codec) => {
      const normalized = this.normalizeCodec(codec);
      if (!normalized) return;
      if (order.includes(normalized)) return;
      order.push(normalized);
    });

    if (order.length === 0) {
      order.push("vp9", "vp8");
    } else if (APP_CONFIG.media.enableVideoCodecFallback && !order.includes("vp8")) {
      order.push("vp8");
    }

    return order;
  }

  static getRoomVideoCodecList(): string {
    return this.getConfiguredVideoCodecOrder().join(",");
  }

  static getBrowserSupportedVideoCodecs(): Set<"vp8" | "vp9"> {
    const supported = new Set<"vp8" | "vp9">();
    try {
      const caps = typeof RTCRtpSender !== "undefined" && typeof RTCRtpSender.getCapabilities === "function"
        ? RTCRtpSender.getCapabilities("video")
        : null;
      caps?.codecs?.forEach((codec) => {
        const mimeType = String((codec as any)?.mimeType || "").toLowerCase();
        if (mimeType.endsWith("/vp9")) supported.add("vp9");
        if (mimeType.endsWith("/vp8")) supported.add("vp8");
      });
    } catch {}
    return supported;
  }

  static getPublishCodecAttemptOrder(): Array<"vp8" | "vp9"> {
    const preferred = this.getConfiguredVideoCodecOrder();
    const supported = this.getBrowserSupportedVideoCodecs();
    if (supported.size === 0) return preferred;

    const allowed = preferred.filter(codec => supported.has(codec));
    return allowed.length > 0 ? allowed : preferred;
  }
}
