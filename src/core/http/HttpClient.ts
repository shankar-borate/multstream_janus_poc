// import { Cookie } from "./Cookie";
// import { Correlation } from "./Correlation";
// import { HttpError } from "./HttpError";
// import type { HttpRequest, HttpResponse } from "./HttpTypes";

/**
 * VCX browser HTTP client:
 * - Sends cookies (credentials: include) by default (needed for IMS/OWB token cookies)
 * - Adds X-Request-Id and X-XSRF-Token (from cookies) automatically when available
 * - Adds client-id header
 * - Provides timeout via AbortController
 * - Normalizes errors to HttpError
 */
class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly clientId: string,
    private readonly defaultTimeoutMs = APP_CONFIG.http.defaultTimeoutMs
  ) {}

  async request<T>(req: Omit<HttpRequest, "url"> & { path: string }): Promise<HttpResponse<T>> {
    const requestId = Correlation.newId();
    const url = this.buildUrl(this.baseUrl, req.path, req.query);

    const controller = new AbortController();
    const timeoutMs = req.timeoutMs ?? this.defaultTimeoutMs;
    const t0 = performance.now();
    const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);

    const xsrf =
      Cookie.get("xsrf-token") ||
      Cookie.get("XSRF-TOKEN") ||
      "";

    const headers: Record<string, string> = {
      "accept": "application/json",
      ...(req.body !== undefined ? { "content-type": "application/json; charset=utf-8" } : {}),
      "client-id": this.clientId,
      "x-request-id": requestId,
      ...(xsrf ? { "x-xsrf-token": xsrf } : {}),
      ...(req.headers ?? {}),
    };

    try {
      const res = await fetch(url, {
        method: req.method,
        headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        credentials: req.credentials ?? "include",
        signal: controller.signal,
      });

      const ms = Math.round(performance.now() - t0);

      const text = await res.text().catch(() => "");
      const data: any = text ? this.safeJson(text) : null;

      if (!res.ok) {
        throw new HttpError(
          `HTTP ${res.status} ${req.method} ${req.path}`,
          res.status,
          requestId,
          url,
          data
        );
      }

      return { status: res.status, data: data as T, headers: res.headers, requestId, url, ms };
    } catch (e: any) {
      const ms = Math.round(performance.now() - t0);

      if (e?.name === "AbortError") {
        throw new HttpError(
          `Timeout (${timeoutMs}ms) ${req.method} ${req.path}`,
          408,
          requestId,
          url,
          { timeoutMs, ms }
        );
      }
      if (e instanceof HttpError) throw e;
      throw new HttpError(
        `Network error ${req.method} ${req.path}`,
        undefined,
        requestId,
        url,
        e
      );
    } finally {
      window.clearTimeout(timeoutHandle);
    }
  }

  async getJson<T>(path: string, query?: HttpRequest["query"], headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "GET", path, query, headers });
  }

  private buildUrl(baseUrl: string, path: string, query?: HttpRequest["query"]): string {
    const u = new URL(path, baseUrl);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        u.searchParams.set(k, String(v));
      }
    }
    return u.toString();
  }

  private safeJson(text: string): any {
    try { return JSON.parse(text); } catch { return text; }
  }
}
