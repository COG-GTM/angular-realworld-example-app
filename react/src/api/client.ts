import axios, { AxiosError } from 'axios';
import { getToken, destroyToken } from './token';

/**
 * Shared axios instance for the Conduit API.
 *
 * Mirrors the three Angular HTTP interceptors:
 * - apiInterceptor   -> baseURL prefixes every request with the API root
 * - tokenInterceptor -> request interceptor attaches `Authorization: Token <jwt>`
 * - errorInterceptor -> response interceptor normalizes errors and logs out on 401
 *
 * On 401 for any endpoint other than `/user`, we clear the token and broadcast a
 * `conduit:unauthorized` event so the AuthProvider can purge auth state. The
 * `/user` endpoint is handled by AuthProvider directly (4XX vs 5XX distinction).
 */
export const api = axios.create({
  baseURL: 'https://api.realworld.show/api',
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export interface NormalizedError extends Errors {
  status: number;
}

interface Errors {
  errors: Record<string, string | string[]>;
}

api.interceptors.response.use(
  response => response,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;
    const url = err.config?.url ?? '';

    // Global 401 handling for all endpoints EXCEPT /user (token expired mid-session).
    if (status === 401 && !url.endsWith('/user')) {
      destroyToken();
      window.dispatchEvent(new CustomEvent('conduit:unauthorized'));
    }

    const data = err.response?.data;
    const body =
      data && typeof data === 'object' && 'errors' in data
        ? (data as Errors)
        : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };

    return Promise.reject({ ...body, status } satisfies NormalizedError);
  },
);
