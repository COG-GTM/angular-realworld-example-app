const API_ROOT = 'https://api.realworld.io/api';

function getToken(): string | null {
  return localStorage.getItem('jwtToken');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  const response = await fetch(`${API_ROOT}${url}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ errors: { body: ['Unknown error'] } }));
    throw error;
  }
  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
