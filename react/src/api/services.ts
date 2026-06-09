import { api } from './client';
import type { Article, ArticleListConfig, Comment, Profile, User } from '../types';

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ user: User }>('/users/login', { user: credentials }),
  register: (credentials: { username: string; email: string; password: string }) =>
    api.post<{ user: User }>('/users', { user: credentials }),
  getCurrentUser: () => api.get<{ user: User }>('/user'),
  updateUser: (user: Partial<User> & { password?: string }) => api.put<{ user: User }>('/user', { user }),
};

export const articlesApi = {
  query: (config: ArticleListConfig) => {
    const params = new URLSearchParams();
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, String(value));
    });
    const qs = params.toString();
    const path = config.type === 'feed' ? '/articles/feed' : '/articles';
    return api.get<{ articles: Article[]; articlesCount: number }>(`${path}${qs ? `?${qs}` : ''}`);
  },
  get: (slug: string) => api.get<{ article: Article }>(`/articles/${slug}`),
  create: (article: Partial<Article>) => api.post<{ article: Article }>('/articles', { article }),
  update: (slug: string, article: Partial<Article>) => api.put<{ article: Article }>(`/articles/${slug}`, { article }),
  delete: (slug: string) => api.delete<void>(`/articles/${slug}`),
  favorite: (slug: string) => api.post<{ article: Article }>(`/articles/${slug}/favorite`),
  unfavorite: (slug: string) => api.delete<{ article: Article }>(`/articles/${slug}/favorite`),
};

export const commentsApi = {
  getAll: (slug: string) => api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`),
  add: (slug: string, body: string) =>
    api.post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } }),
  delete: (slug: string, commentId: number) => api.delete<void>(`/articles/${slug}/comments/${commentId}`),
};

export const profilesApi = {
  get: (username: string) => api.get<{ profile: Profile }>(`/profiles/${username}`),
  follow: (username: string) => api.post<{ profile: Profile }>(`/profiles/${username}/follow`),
  unfollow: (username: string) => api.delete<{ profile: Profile }>(`/profiles/${username}/follow`),
};

export const tagsApi = {
  getAll: () => api.get<{ tags: string[] }>('/tags'),
};
