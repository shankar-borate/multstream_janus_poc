class HttpError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly requestId?: string,
    public readonly url?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}
