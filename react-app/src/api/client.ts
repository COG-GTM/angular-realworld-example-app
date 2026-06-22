import { getToken } from './jwt';

const API_ROOT = 'https://api.realworld.show/api';

/**
 * Normalized error shape thrown by the API client.
 * Mirrors the Angular errorInterceptor output: `{ ...body, status }`.
 */
export interface ApiError {
  errors: { [key: string]: string | string[] };
  status: number;
}

/**
 * Global 401 handler. Registered by the auth layer so that a token that expires
 * mid-session (any endpoint except `/user`) triggers a logout. Mirrors the
 * Angular errorInterceptor's global purgeAuth() behaviour.
 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

type Params = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  params?: Params;
  body?: unknown;
}

async function request<T>(method: string, url: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  let fullUrl = `${API_ROOT}${url}`;
  if (options.params) {
    const search = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        search.set(key, String(value));
      }
    });
    const query = search.toString();
    if (query) {
      fullUrl += `?${query}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // Network error (status 0 in the Angular world)
    throw normalizeError(undefined, 0);
  }

  if (!response.ok) {
    // Global 401 handling for all endpoints EXCEPT /user
    // (token expired mid-session -> logout). /user is handled by the auth layer.
    if (response.status === 401 && !url.endsWith('/user')) {
      unauthorizedHandler?.();
    }
    const errorBody = await safeJson(response);
    throw normalizeError(errorBody, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function normalizeError(body: unknown, status: number): ApiError {
  const hasErrors = !!body && typeof body === 'object' && 'errors' in body;
  const normalized = hasErrors
    ? (body as { errors: { [key: string]: string | string[] } })
    : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };
  return { ...normalized, status };
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('POST', url, { ...options, body }),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', url, { ...options, body }),
  delete: <T>(url: string, options?: RequestOptions) => request<T>('DELETE', url, options),
};
