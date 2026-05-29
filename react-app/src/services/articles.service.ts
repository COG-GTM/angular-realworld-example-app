import type { Article, ArticleListConfig } from '../types';
import { api } from './api';

export function queryArticles(
  config: ArticleListConfig,
  signal?: AbortSignal,
): Promise<{ articles: Article[]; articlesCount: number }> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(config.filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const path = '/articles' + (config.type === 'feed' ? '/feed' : '');
  const qs = params.toString();
  return api.get(`${path}${qs ? `?${qs}` : ''}`, signal);
}

export function getArticle(slug: string, signal?: AbortSignal): Promise<Article> {
  return api.get<{ article: Article }>(`/articles/${slug}`, signal).then(d => d.article);
}

export function createArticle(article: Partial<Article>): Promise<Article> {
  return api.post<{ article: Article }>('/articles/', { article }).then(d => d.article);
}

export function updateArticle(article: Partial<Article>): Promise<Article> {
  return api.put<{ article: Article }>(`/articles/${article.slug}`, { article }).then(d => d.article);
}

export function deleteArticle(slug: string): Promise<void> {
  return api.delete(`/articles/${slug}`);
}

export function favoriteArticle(slug: string): Promise<Article> {
  return api.post<{ article: Article }>(`/articles/${slug}/favorite`).then(d => d.article);
}

export function unfavoriteArticle(slug: string): Promise<void> {
  return api.delete(`/articles/${slug}/favorite`);
}
