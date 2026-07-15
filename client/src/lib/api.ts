const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, json?.error?.message ?? "Request failed", json?.error?.code, json?.error?.details);
  }
  return json as T;
}
