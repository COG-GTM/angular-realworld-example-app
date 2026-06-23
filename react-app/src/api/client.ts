import { getToken } from '../auth/jwt';

// apiInterceptor equivalent: all requests are prefixed with the RealWorld API root.
const API_ROOT = 'https://api.realworld.show/api';

const NETWORK_ERROR = { network: ['Unable to connect. Please check your internet connection.'] };

// errorInterceptor equivalent: a global 401 (for endpoints other than /user) logs the user out.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

export interface ApiError {
  errors: Record<string, string[] | string>;
  status: number;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // tokenInterceptor equivalent: attach the auth token when present.
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(API_ROOT + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw { errors: NETWORK_ERROR, status: 0 } satisfies ApiError;
  }

  if (!response.ok) {
    if (response.status === 401 && !path.split('?')[0].endsWith('/user')) {
      onUnauthorized?.();
    }
    let parsed: unknown = null;
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
    const errorBody =
      parsed && typeof parsed === 'object' && 'errors' in parsed ? (parsed as Errorsish) : { errors: NETWORK_ERROR };
    throw { ...errorBody, status: response.status } satisfies ApiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

interface Errorsish {
  errors: Record<string, string[] | string>;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
