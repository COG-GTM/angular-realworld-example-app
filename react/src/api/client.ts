const API_BASE = 'https://api.realworld.show/api';

const TOKEN_KEY = 'jwtToken';

export const jwt = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  saveToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  destroyToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public errors: Record<string, string[]>,
  ) {
    super(`API error ${status}`);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = jwt.getToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let errors: Record<string, string[]> = { error: [res.statusText] };
    try {
      const data = await res.json();
      if (data && typeof data === 'object' && data.errors) {
        errors = data.errors;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, errors);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
