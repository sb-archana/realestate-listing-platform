import { apiUrl, parseApiResponse } from "./api";

// Access token lives in memory only (never localStorage) to limit XSS blast
// radius; the refresh token is an httpOnly cookie the browser attaches
// automatically, so silent refresh works across a full page reload too.
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(apiUrl("/api/auth/refresh"), { method: "POST", credentials: "include" });
    if (!res.ok) return null;
    const data = await parseApiResponse<{ accessToken: string }>(res);
    accessToken = data.accessToken;
    return accessToken;
  } catch {
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the bearer access token. Default true. */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: HeadersInit = {};
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(apiUrl(path), { method, headers, body: payload, credentials: "include" });

  if (res.status === 401 && auth && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, true);
    }
  }

  return parseApiResponse<T>(res);
}

export const apiClient = {
  get: <T,>(path: string, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...opts, method: "GET" }),
  post: <T,>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T,>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  del: <T,>(path: string, opts?: Omit<RequestOptions, "method" | "body">) => request<T>(path, { ...opts, method: "DELETE" }),
};
