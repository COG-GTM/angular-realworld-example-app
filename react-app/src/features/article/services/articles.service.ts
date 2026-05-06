import { api } from '../../../core/api';
import type { ArticleListConfig } from '../models/article-list-config.model';
import type { Article } from '../models/article.model';

export const ArticlesService = {
  query(config: ArticleListConfig): Promise<{ articles: Article[]; articlesCount: number }> {
    const params = new URLSearchParams();

    Object.entries(config.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    const path = '/articles' + (config.type === 'feed' ? '/feed' : '');

    return api.get<{ articles: Article[]; articlesCount: number }>(`${path}${queryString ? '?' + queryString : ''}`);
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
