import { getToken } from './jwt';

/**
 * Fetch wrapper that replaces the three Angular HTTP interceptors:
 *
 * - `apiInterceptor`   -> prepends the external Conduit API base URL.
 * - `tokenInterceptor` -> attaches `Authorization: Token <jwt>` when present.
 * - `errorInterceptor` -> on a 401 for any endpoint except `/user`, purges auth
 *                         (token expired mid-session); normalizes every error to
 *                         `{ ...body, status }` so callers can read `err.errors`
 *                         and `err.status`.
 *
 * The base URL and the `Token` auth scheme are part of the API contract and must
 * not change.
 */
const API_BASE_URL = 'https://api.realworld.show/api';

export interface ApiError {
  errors: { [key: string]: string[] };
  status: number;
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * Registers the global 401 handler (wired to `AuthContext.purgeAuth`). Kept as a
 * setter to avoid a circular import between the auth state and the API layer.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        search.set(key, String(value));
      }
    });
    const query = search.toString();
    if (query) {
      url += `?${query}`;
    }
  }
  return url;
}

const NETWORK_ERROR: ApiError['errors'] = {
  network: ['Unable to connect. Please check your internet connection.'],
};

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Network error (no response) -> mirror the interceptor's status 0 fallback.
    const apiError: ApiError = { errors: NETWORK_ERROR, status: 0 };
    throw apiError;
  }

  if (!response.ok) {
    // Global 401 handling for all endpoints EXCEPT /user (token expired
    // mid-session -> logout). /user is handled by the auth state machine.
    if (response.status === 401 && !path.endsWith('/user')) {
      onUnauthorized?.();
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const errors =
      body && typeof body === 'object' && 'errors' in body
        ? (body as { errors: ApiError['errors'] }).errors
        : NETWORK_ERROR;

    const apiError: ApiError = { errors, status: response.status };
    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body: body ?? {} }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body: body ?? {} }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
