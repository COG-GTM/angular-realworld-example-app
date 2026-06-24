const API_ROOT = 'https://api.realworld.show/api';

function getToken(): string | null {
  return localStorage.getItem('jwtToken');
}

function saveToken(token: string): void {
  localStorage.setItem('jwtToken', token);
}

function destroyToken(): void {
  localStorage.removeItem('jwtToken');
}

export const jwt = { getToken, saveToken, destroyToken };

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_ROOT}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const normalized =
      errorBody && typeof errorBody === 'object' && 'errors' in (errorBody as Record<string, unknown>)
        ? errorBody
        : {
            errors: {
              network: ['Unable to connect. Please check your internet connection.'],
            },
          };
    throw { ...normalized, status: response.status };
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const requests = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
};
