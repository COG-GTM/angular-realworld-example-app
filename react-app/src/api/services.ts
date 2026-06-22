import { apiClient } from './client';
import type { Article, ArticleListConfig, Comment, Profile, User } from '../types';

export const articlesApi = {
  query(config: ArticleListConfig): Promise<{ articles: Article[]; articlesCount: number }> {
    const params: Record<string, string | number> = {};
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params[key] = value;
      }
    });
    return apiClient.get<{ articles: Article[]; articlesCount: number }>(
      '/articles' + (config.type === 'feed' ? '/feed' : ''),
      { params },
    );
  },

  get(slug: string): Promise<Article> {
    return apiClient.get<{ article: Article }>(`/articles/${slug}`).then(data => data.article);
  },

  delete(slug: string): Promise<void> {
    return apiClient.delete<void>(`/articles/${slug}`);
  },

  create(article: Partial<Article>): Promise<Article> {
    return apiClient.post<{ article: Article }>('/articles/', { article }).then(data => data.article);
  },

  update(article: Partial<Article>): Promise<Article> {
    return apiClient.put<{ article: Article }>(`/articles/${article.slug}`, { article }).then(data => data.article);
  },

  favorite(slug: string): Promise<Article> {
    return apiClient.post<{ article: Article }>(`/articles/${slug}/favorite`, {}).then(data => data.article);
  },

  unfavorite(slug: string): Promise<void> {
    return apiClient.delete<void>(`/articles/${slug}/favorite`);
  },
};

export const commentsApi = {
  getAll(slug: string): Promise<Comment[]> {
    return apiClient.get<{ comments: Comment[] }>(`/articles/${slug}/comments`).then(data => data.comments);
  },

  add(slug: string, body: string): Promise<Comment> {
    return apiClient
      .post<{ comment: Comment }>(`/articles/${slug}/comments`, { comment: { body } })
      .then(data => data.comment);
  },

  delete(commentId: string, slug: string): Promise<void> {
    return apiClient.delete<void>(`/articles/${slug}/comments/${commentId}`);
  },
};

export const tagsApi = {
  getAll(): Promise<string[]> {
    return apiClient.get<{ tags: string[] }>('/tags').then(data => data.tags);
  },
};

export const profileApi = {
  get(username: string): Promise<Profile> {
    return apiClient.get<{ profile: Profile }>('/profiles/' + username).then(data => data.profile);
  },

  follow(username: string): Promise<Profile> {
    return apiClient.post<{ profile: Profile }>('/profiles/' + username + '/follow', {}).then(data => data.profile);
  },

  unfollow(username: string): Promise<Profile> {
    return apiClient.delete<{ profile: Profile }>('/profiles/' + username + '/follow').then(data => data.profile);
  },
};

export const userApi = {
  getCurrentUser(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/user');
  },

  login(credentials: { email: string; password: string }): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/users/login', { user: credentials });
  },

  register(credentials: { username: string; email: string; password: string }): Promise<{ user: User }> {
    return apiClient.post<{ user: User }>('/users', { user: credentials });
  },

  update(user: Partial<User> & { password?: string }): Promise<{ user: User }> {
    return apiClient.put<{ user: User }>('/user', { user });
  },
};
