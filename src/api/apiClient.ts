import { jwtService } from './jwt';

const API_BASE = 'https://api.realworld.show/api';

/**
 * Registered by the auth layer so the client can log the user out when a
 * 401 is received on any endpoint other than `/user` (mirrors the Angular
 * errorInterceptor "token expired mid-session" behaviour).
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Normalises errors into `{ errors: {...}, status }` so components can read
 * `errors` for display and the auth logic can branch on `status`.
 */
function normalizeError(data: unknown, status: number): { errors: Record<string, string | string[]>; status: number } {
  const body =
    data && typeof data === 'object' && 'errors' in data
      ? (data as { errors: Record<string, string | string[]> })
      : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };
  return { ...body, status };
}

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return API_BASE + path;
  const search = new URLSearchParams();
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined) {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return API_BASE + path + (query ? `?${query}` : '');
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; params?: QueryParams } = {},
): Promise<T> {
  const token = jwtService.getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Network error (offline, connection refused, timeout) → status 0
    throw normalizeError(null, 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Keep the raw text; callers that expect a shape will fail gracefully.
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !path.endsWith('/user')) {
      onUnauthorized?.();
    }
    throw normalizeError(data, res.status);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, params?: QueryParams) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
