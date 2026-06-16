import { apiClient } from '../api/apiClient';
import type { Article } from '../types/article';
import type { ArticleListConfig } from '../types/article-list-config';

interface ArticleResponse {
  article: Article;
}

export interface ArticleListResponse {
  articles: Article[];
  articlesCount: number;
}

export const articlesService = {
  query(config: ArticleListConfig): Promise<ArticleListResponse> {
    const params: Record<string, string | number | undefined> = {};
    (Object.keys(config.filters) as (keyof ArticleListConfig['filters'])[]).forEach(key => {
      const value = config.filters[key];
      if (value !== undefined) {
        params[key] = value;
      }
    });

    return apiClient.get<ArticleListResponse>('/articles' + (config.type === 'feed' ? '/feed' : ''), { params });
  },

  get(slug: string): Promise<Article> {
    return apiClient.get<ArticleResponse>(`/articles/${slug}`).then(data => data.article);
  },

  delete(slug: string): Promise<void> {
    return apiClient.del<void>(`/articles/${slug}`);
  },

  create(article: Partial<Article>): Promise<Article> {
    return apiClient.post<ArticleResponse>('/articles/', { article }).then(data => data.article);
  },

  update(article: Partial<Article>): Promise<Article> {
    return apiClient.put<ArticleResponse>(`/articles/${article.slug}`, { article }).then(data => data.article);
  },

  favorite(slug: string): Promise<Article> {
    return apiClient.post<ArticleResponse>(`/articles/${slug}/favorite`, {}).then(data => data.article);
  },

  unfavorite(slug: string): Promise<void> {
    return apiClient.del<void>(`/articles/${slug}/favorite`);
  },
};
