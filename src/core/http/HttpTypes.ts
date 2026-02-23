type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpRequest {
  method: HttpMethod;
  /** Absolute URL */
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  timeoutMs?: number;
  /** default: include (send cookies) */
  credentials?: RequestCredentials;
}

interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Headers;
  requestId: string;
  url: string;
  ms: number;
}
