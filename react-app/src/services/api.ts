import { jwtService } from './jwt';
import type { Article, ArticleListConfig, Comment, Errors, Profile, User, UserSettings } from '../models';

const API_URL = 'https://api.realworld.show/api';

export interface ApiError extends Errors {
  status: number;
}

let onUnauthorized: () => void = () => {};

/**
 * Registers the logout handler used when a request outside of /user returns 401,
 * mirroring the Angular errorInterceptor.
 */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = jwtService.getToken();
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw networkError(0);
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/user?') && path !== '/user') {
      onUnauthorized();
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (payload && typeof payload === 'object' && 'errors' in payload) {
      throw { ...(payload as Errors), status: response.status } satisfies ApiError;
    }
    throw networkError(response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function networkError(status: number): ApiError {
  return {
    errors: { network: 'Unable to connect. Please check your internet connection.' },
    status,
  };
}

export const usersApi = {
  current: () => request<{ user: User }>('GET', '/user'),
  login: (credentials: { email: string; password: string }) =>
    request<{ user: User }>('POST', '/users/login', { user: credentials }),
  register: (credentials: { email: string; password: string; username: string }) =>
    request<{ user: User }>('POST', '/users', { user: credentials }),
  update: (user: UserSettings) => request<{ user: User }>('PUT', '/user', { user }),
};

export const articlesApi = {
  query: (config: ArticleListConfig) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(config.filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const query = params.toString();
    return request<{ articles: Article[]; articlesCount: number }>(
      'GET',
      `/articles${config.type === 'feed' ? '/feed' : ''}${query ? `?${query}` : ''}`,
    );
  },
  get: (slug: string) => request<{ article: Article }>('GET', `/articles/${slug}`).then(data => data.article),
  delete: (slug: string) => request<void>('DELETE', `/articles/${slug}`),
  create: (article: Partial<Article>) =>
    request<{ article: Article }>('POST', '/articles/', { article }).then(data => data.article),
  update: (article: Partial<Article>) =>
    request<{ article: Article }>('PUT', `/articles/${article.slug}`, { article }).then(data => data.article),
  favorite: (slug: string) =>
    request<{ article: Article }>('POST', `/articles/${slug}/favorite`, {}).then(data => data.article),
  unfavorite: (slug: string) => request<void>('DELETE', `/articles/${slug}/favorite`),
};

export const commentsApi = {
  getAll: (slug: string) =>
    request<{ comments: Comment[] }>('GET', `/articles/${slug}/comments`).then(data => data.comments),
  add: (slug: string, body: string) =>
    request<{ comment: Comment }>('POST', `/articles/${slug}/comments`, { comment: { body } }).then(
      data => data.comment,
    ),
  delete: (commentId: string, slug: string) => request<void>('DELETE', `/articles/${slug}/comments/${commentId}`),
};

export const profilesApi = {
  get: (username: string) => request<{ profile: Profile }>('GET', `/profiles/${username}`).then(data => data.profile),
  follow: (username: string) =>
    request<{ profile: Profile }>('POST', `/profiles/${username}/follow`, {}).then(data => data.profile),
  unfollow: (username: string) =>
    request<{ profile: Profile }>('DELETE', `/profiles/${username}/follow`).then(data => data.profile),
};

export const tagsApi = {
  getAll: () => request<{ tags: string[] }>('GET', '/tags').then(data => data.tags),
};
