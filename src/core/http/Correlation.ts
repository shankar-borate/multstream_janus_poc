class Correlation {
  /** Browser-safe request id */
  static newId(): string {
    const c: any = crypto as any;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
