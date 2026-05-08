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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_ROOT}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      errors: { error: [`${response.status} ${response.statusText}`] },
    }));
    throw error;
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export const Auth = {
  current: () => request<{ user: import('../models').User }>('/user'),
  login: (email: string, password: string) =>
    request<{ user: import('../models').User }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ user: { email, password } }),
    }),
  register: (username: string, email: string, password: string) =>
    request<{ user: import('../models').User }>('/users', {
      method: 'POST',
      body: JSON.stringify({ user: { username, email, password } }),
    }),
  update: (user: Partial<import('../models').User>) =>
    request<{ user: import('../models').User }>('/user', {
      method: 'PUT',
      body: JSON.stringify({ user }),
    }),
  saveToken,
  destroyToken,
  getToken,
};

export const Articles = {
  all: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.set(key, String(val));
    });
    const qs = query.toString();
    return request<{ articles: import('../models').Article[]; articlesCount: number }>(
      `/articles${qs ? `?${qs}` : ''}`,
    );
  },
  feed: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) query.set(key, String(val));
    });
    const qs = query.toString();
    return request<{ articles: import('../models').Article[]; articlesCount: number }>(
      `/articles/feed${qs ? `?${qs}` : ''}`,
    );
  },
  get: (slug: string) =>
    request<{ article: import('../models').Article }>(`/articles/${slug}`).then(data => data.article),
  create: (article: Partial<import('../models').Article>) =>
    request<{ article: import('../models').Article }>('/articles/', {
      method: 'POST',
      body: JSON.stringify({ article }),
    }).then(data => data.article),
  update: (article: Partial<import('../models').Article> & { slug: string }) =>
    request<{ article: import('../models').Article }>(`/articles/${article.slug}`, {
      method: 'PUT',
      body: JSON.stringify({ article }),
    }).then(data => data.article),
  delete: (slug: string) => request<void>(`/articles/${slug}`, { method: 'DELETE' }),
  favorite: (slug: string) =>
    request<{ article: import('../models').Article }>(`/articles/${slug}/favorite`, {
      method: 'POST',
    }).then(data => data.article),
  unfavorite: (slug: string) => request<void>(`/articles/${slug}/favorite`, { method: 'DELETE' }),
};

export const Comments = {
  getAll: (slug: string) =>
    request<{ comments: import('../models').Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments),
  add: (slug: string, body: string) =>
    request<{ comment: import('../models').Comment }>(`/articles/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment: { body } }),
    }).then(data => data.comment),
  delete: (slug: string, commentId: string) =>
    request<void>(`/articles/${slug}/comments/${commentId}`, {
      method: 'DELETE',
    }),
};

export const Tags = {
  getAll: () => request<{ tags: string[] }>('/tags').then(data => data.tags),
};

export const Profiles = {
  get: (username: string) =>
    request<{ profile: import('../models').Profile }>(`/profiles/${username}`).then(data => data.profile),
  follow: (username: string) =>
    request<{ profile: import('../models').Profile }>(`/profiles/${username}/follow`, {
      method: 'POST',
    }).then(data => data.profile),
  unfollow: (username: string) =>
    request<{ profile: import('../models').Profile }>(`/profiles/${username}/follow`, {
      method: 'DELETE',
    }).then(data => data.profile),
};
