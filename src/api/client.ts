import type { Errors } from '../types/errors';
import { getToken } from './jwt';

const API_BASE = 'https://api.realworld.show/api';

const NETWORK_ERROR_MESSAGE = 'Unable to connect. Please check your internet connection.';

/**
 * Global handler invoked when a 401 is received on an endpoint other than
 * `/user`. Wired by `AuthProvider` to `purgeAuth` (token expired mid-session).
 * Kept as a settable hook to avoid an import cycle between the client and auth.
 */
let onUnauthorized: () => void = () => {};

export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: QueryParams;
}

function networkError(status = 0): Errors {
  return { errors: { network: [NETWORK_ERROR_MESSAGE] }, status };
}

function buildUrl(path: string, query?: QueryParams): string {
  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }
  return url;
}

/**
 * Normalizes an error body into the `{ errors, status }` shape. If the body is an
 * object containing an `errors` key it is preserved; otherwise a user-friendly
 * network fallback message is used (matching the Angular error interceptor).
 */
function normalizeErrorBody(body: unknown, status: number): Errors {
  if (body && typeof body === 'object' && 'errors' in body) {
    return { ...(body as object), status } as Errors;
  }
  return networkError(status);
}

/**
 * Thin fetch wrapper replacing Angular's HttpClient + api/token/error interceptors.
 *
 * - Prepends the API base URL and applies query params.
 * - Attaches `Authorization: Token <jwt>` when a token is present.
 * - Normalizes errors to `{ errors, status }`; network/parse failures become a
 *   friendly "Unable to connect" message.
 * - On 401 for endpoints other than `/user`, triggers the global logout handler.
 * - Accepts any 2xx as success; empty/204 bodies resolve to `undefined`.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  const url = buildUrl(path, query);

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    // Network failure (offline, connection refused, timeout, etc.)
    throw networkError(0);
  }

  if (!response.ok) {
    if (response.status === 401 && !path.endsWith('/user')) {
      onUnauthorized();
    }
    let parsed: unknown = undefined;
    try {
      const text = await response.text();
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    throw normalizeErrorBody(parsed, response.status);
  }

  // Success: accept any 2xx. Empty body (e.g. 204 No Content) resolves to undefined.
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    // Malformed JSON on a 2xx response (server bug) -> treat as unavailable/network.
    throw networkError(response.status);
  }
}
