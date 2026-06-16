import { getToken } from '../auth/jwt';
import type { Errors } from '../types/errors';

/**
 * apiClient — a fetch wrapper that reproduces the three Angular HTTP interceptors:
 *
 * - apiInterceptor:   prefixes every request with the RealWorld API root.
 * - tokenInterceptor: adds `Authorization: Token <jwt>` when a token is stored.
 * - errorInterceptor: normalizes errors to `{ ...body, status }` (with a network
 *                     fallback message), and triggers a global logout on a 401 for
 *                     any endpoint other than `/user`.
 *
 * Any 2xx response is treated as success (so a DELETE returning 200 or 204 both work).
 */
export const API_ROOT = 'https://api.realworld.show/api';

export type NormalizedError = Errors & { status: number };

const NETWORK_FALLBACK: Errors = {
  errors: { network: ['Unable to connect. Please check your internet connection.'] },
};

let onUnauthorized: (() => void) | null = null;

/** Wire the global 401 handler (AuthContext registers `purgeAuth`). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function normalizeError(parsed: unknown, status: number): NormalizedError {
  const hasErrors = !!parsed && typeof parsed === 'object' && 'errors' in (parsed as Record<string, unknown>);
  const body = hasErrors ? (parsed as Errors) : NETWORK_FALLBACK;
  return { ...body, status };
}

export interface RequestOptions {
  params?: Record<string, string | number | undefined>;
}

async function request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  let url = API_ROOT + path;

  if (options?.params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network/connection error → status 0, network fallback message.
    throw normalizeError(undefined, 0);
  }

  const text = await response.text().catch(() => '');
  let parsed: unknown = undefined;
  let parseFailed = false;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parseFailed = true;
    }
  }

  if (response.ok) {
    // A non-empty body that failed to parse is a malformed response: surface it as
    // an error (callers like the auth check decide what to do with it).
    if (parseFailed) {
      throw normalizeError(undefined, response.status);
    }
    return parsed as T;
  }

  if (response.status === 401 && !path.endsWith('/user')) {
    onUnauthorized?.();
  }
  throw normalizeError(parsed, response.status);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  del: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};
