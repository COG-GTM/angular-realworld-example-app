import { api } from './client';
import type { Article, ArticleListConfig, Comment, Profile, User } from '../types';

/**
 * Typed wrappers around every Conduit API endpoint used by the app.
 * These replace the Angular `*.service.ts` classes (ArticlesService,
 * CommentsService, TagsService, ProfileService, UserService HTTP calls).
 */

// --- Auth / current user ---
export const AuthAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ user: User }>('/users/login', { user: credentials }).then(r => r.data.user),

  register: (credentials: { username: string; email: string; password: string }) =>
    api.post<{ user: User }>('/users', { user: credentials }).then(r => r.data.user),

  current: () => api.get<{ user: User }>('/user').then(r => r.data.user),

  update: (user: Partial<User>) => api.put<{ user: User }>('/user', { user }).then(r => r.data.user),
};

// --- Articles ---
export const ArticlesAPI = {
  query: (config: ArticleListConfig) => {
    const params = new URLSearchParams();
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    const path = '/articles' + (config.type === 'feed' ? '/feed' : '');
    return api.get<{ articles: Article[]; articlesCount: number }>(path, { params }).then(r => r.data);
  },

  get: (slug: string) => api.get<{ article: Article }>(`/articles/${slug}`).then(r => r.data.article),

  create: (article: Partial<Article>) =>
    api.post<{ article: Article }>('/articles/', { article }).then(r => r.data.article),

  update: (article: Partial<Article>) =>
    api.put<{ article: Article }>(`/articles/${article.slug}`, { article }).then(r => r.data.article),

  delete: (slug: string) => api.delete<void>(`/articles/${slug}`).then(() => undefined),

  favorite: (slug: string) =>
    api.post<{ article: Article }>(`/articles/${slug}/favorite`, {}).then(r => r.data.article),

  unfavorite: (slug: string) => api.delete<void>(`/articles/${slug}/favorite`).then(() => undefined),
};

// --- Comments ---
export const CommentsAPI = {
  getAll: (slug: string) => api.get<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(r => r.data.comments),

  add: (slug: string, body: string) =>
    api.post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } }).then(r => r.data.comment),

  delete: (slug: string, commentId: string) =>
    api.delete<void>(`/articles/${slug}/comments/${commentId}`).then(() => undefined),
};

// --- Tags ---
export const TagsAPI = {
  getAll: () => api.get<{ tags: string[] }>('/tags').then(r => r.data.tags),
};

// --- Profiles ---
export const ProfileAPI = {
  get: (username: string) => api.get<{ profile: Profile }>(`/profiles/${username}`).then(r => r.data.profile),

  follow: (username: string) =>
    api.post<{ profile: Profile }>(`/profiles/${username}/follow`, {}).then(r => r.data.profile),

  unfollow: (username: string) =>
    api.delete<{ profile: Profile }>(`/profiles/${username}/follow`).then(r => r.data.profile),
};
