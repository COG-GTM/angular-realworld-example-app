import type { Article, ArticleListConfig } from '../types/article';
import { apiFetch, type QueryParams } from './client';

export interface ArticleListResponse {
  articles: Article[];
  articlesCount: number;
}

export function query(config: ArticleListConfig): Promise<ArticleListResponse> {
  const path = '/articles' + (config.type === 'feed' ? '/feed' : '');
  return apiFetch<ArticleListResponse>(path, { query: config.filters as QueryParams });
}

export function get(slug: string): Promise<Article> {
  return apiFetch<{ article: Article }>(`/articles/${slug}`).then(d => d.article);
}

export function del(slug: string): Promise<void> {
  return apiFetch<void>(`/articles/${slug}`, { method: 'DELETE' });
}

export function create(article: Partial<Article>): Promise<Article> {
  // Keep the trailing slash to match the original Angular service (and e2e route mocks).
  return apiFetch<{ article: Article }>('/articles/', { method: 'POST', body: { article } }).then(d => d.article);
}

export function update(article: Partial<Article>): Promise<Article> {
  return apiFetch<{ article: Article }>(`/articles/${article.slug}`, {
    method: 'PUT',
    body: { article },
  }).then(d => d.article);
}

export function favorite(slug: string): Promise<Article> {
  return apiFetch<{ article: Article }>(`/articles/${slug}/favorite`, { method: 'POST', body: {} }).then(
    d => d.article,
  );
}

export function unfavorite(slug: string): Promise<void> {
  return apiFetch<void>(`/articles/${slug}/favorite`, { method: 'DELETE' });
}
