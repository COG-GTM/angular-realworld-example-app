import { JwtService } from './auth/services/jwt.service';

const API_ROOT = 'https://api.realworld.show/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = JwtService.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_ROOT}${url}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    }));

    const error =
      errorBody && typeof errorBody === 'object' && 'errors' in errorBody
        ? errorBody
        : { errors: { network: ['Unable to connect. Please check your internet connection.'] } };

    throw { ...error, status: response.status };
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
