const API_ROOT = 'https://api.realworld.show/api';

function getToken(): string | null {
  return window.localStorage.getItem('jwtToken');
}

function saveToken(token: string): void {
  window.localStorage.setItem('jwtToken', token);
}

function destroyToken(): void {
  window.localStorage.removeItem('jwtToken');
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };

  const res = await fetch(`${API_ROOT}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const normalized =
      errorBody && typeof errorBody === 'object' && 'errors' in errorBody
        ? errorBody
        : {
            errors: {
              network: ['Unable to connect. Please check your internet connection.'],
            },
          };
    throw { ...normalized, status: res.status };
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
  getToken,
  saveToken,
  destroyToken,
};
