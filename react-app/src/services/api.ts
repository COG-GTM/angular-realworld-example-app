const API_ROOT = 'https://api.realworld.show/api';

function getToken(): string | null {
  return window.localStorage.getItem('jwtToken');
}

export function saveToken(token: string): void {
  window.localStorage.setItem('jwtToken', token);
}

export function destroyToken(): void {
  window.localStorage.removeItem('jwtToken');
}

async function request<T>(url: string, options: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${url}`, {
      ...options,
      headers,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw { errors: { network: ['Unable to connect to the server. Please check your internet connection.'] } };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: { error: [res.statusText] } }));
    throw body;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(url: string, signal?: AbortSignal) => request<T>(url, { method: 'GET' }, signal),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
