import { getToken } from './jwt';
import type { Errors } from '../types';

/**
 * Base API URL. Matches the Angular apiInterceptor which rewrote every request
 * to `https://api.realworld.show/api`. Do not change — this is the external
 * data contract for the RealWorld/Conduit backend.
 */
const API_ROOT = 'https://api.realworld.show/api';

/**
 * Normalized API error: the response body (with an `errors` map) plus the HTTP
 * `status`. Mirrors the shape thrown by the Angular errorInterceptor so the
 * components/auth logic can read `err.errors` and `err.status` the same way.
 */
export type ApiError = Errors & { status: number };

export type QueryParams = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  params?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(API_ROOT + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
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
    // Network error (status 0 equivalent) — match the Angular fallback message.
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw {
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
      status: 0,
    } as ApiError;
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const normalized =
      body && typeof body === 'object' && 'errors' in body
        ? (body as Errors)
        : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };

    throw { ...normalized, status: response.status } as ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
