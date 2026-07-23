import axios, { AxiosError } from 'axios';
import { getToken } from '../auth/jwt';

/**
 * Base URL for the RealWorld API. Replicates api.interceptor.ts which prefixed
 * every request URL with this value.
 */
export const API_BASE_URL = 'https://api.realworld.show/api';

/**
 * Normalized error shape produced by the response interceptor. Mirrors the
 * Angular error.interceptor.ts contract: the API error body spread together
 * with the HTTP status (0 for network errors).
 */
export interface NormalizedError {
  errors: Record<string, string[] | string>;
  status: number;
}

/**
 * Handler invoked when a 401 is received for any endpoint other than `/user`
 * (token expired mid-session). Wired up by the UserProvider to call purgeAuth.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// token.interceptor.ts: attach `Authorization: Token <jwt>` when a token exists.
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Token ${token}`);
  }
  return config;
});

/**
 * Normalizes an axios error into `{ ...body, status }`, mirroring the Angular
 * error.interceptor.ts contract. When the server returned no usable error body
 * (network failure, non-JSON response) a network-error fallback message is used.
 */
export function normalizeError(error: AxiosError): NormalizedError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data;
  const body =
    data && typeof data === 'object' && 'errors' in data
      ? (data as { errors: Record<string, string[] | string> })
      : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };

  return { ...body, status };
}

// error.interceptor.ts: global 401 handling + error normalization.
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const url = error.config?.url ?? '';

    // Global 401 handling for all endpoints EXCEPT /user
    // (/user is handled by UserService.getCurrentUser with 4XX vs 5XX logic).
    if (status === 401 && !url.endsWith('/user')) {
      onUnauthorized?.();
    }

    return Promise.reject(normalizeError(error));
  },
);
