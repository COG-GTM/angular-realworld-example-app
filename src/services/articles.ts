import { apiClient } from './api';
import type { QueryParams } from './api';
import type { Article, ArticleListConfig } from '../types';

export const articlesService = {
  query(config: ArticleListConfig, signal?: AbortSignal): Promise<{ articles: Article[]; articlesCount: number }> {
    const params: QueryParams = { ...config.filters };
    return apiClient.get<{ articles: Article[]; articlesCount: number }>(
      '/articles' + (config.type === 'feed' ? '/feed' : ''),
      { params, signal },
    );
  },

  get(slug: string, signal?: AbortSignal): Promise<Article> {
    return apiClient.get<{ article: Article }>(`/articles/${slug}`, { signal }).then(data => data.article);
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
