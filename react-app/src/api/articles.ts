import { api } from './client';
import { Article, ArticleListConfig } from '../types';

export interface ArticleListResponse {
  articles: Article[];
  articlesCount: number;
}

export const articlesApi = {
  query(config: ArticleListConfig): Promise<ArticleListResponse> {
    const params = new URLSearchParams();
    (Object.keys(config.filters) as (keyof ArticleListConfig['filters'])[]).forEach(key => {
      const value = config.filters[key];
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return api.get<ArticleListResponse>(
      '/articles' + (config.type === 'feed' ? '/feed' : '') + (query ? `?${query}` : ''),
    );
  },

  get(slug: string): Promise<Article> {
    return api.get<{ article: Article }>(`/articles/${slug}`).then(data => data.article);
  },

  delete(slug: string): Promise<void> {
    return api.delete<void>(`/articles/${slug}`);
  },

  create(article: Partial<Article>): Promise<Article> {
    return api.post<{ article: Article }>('/articles/', { article }).then(data => data.article);
  },

  update(article: Partial<Article>): Promise<Article> {
    return api.put<{ article: Article }>(`/articles/${article.slug}`, { article }).then(data => data.article);
  },

  favorite(slug: string): Promise<Article> {
    return api.post<{ article: Article }>(`/articles/${slug}/favorite`, {}).then(data => data.article);
  },

  unfavorite(slug: string): Promise<void> {
    return api.delete<void>(`/articles/${slug}/favorite`);
  },
};
