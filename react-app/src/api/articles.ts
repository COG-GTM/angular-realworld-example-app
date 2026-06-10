import { apiClient } from './apiClient';
import type { Article, ArticleListConfig } from '../types';

export async function queryArticles(
  config: ArticleListConfig,
  signal?: AbortSignal,
): Promise<{ articles: Article[]; articlesCount: number }> {
  const params: Record<string, string | number> = {};
  Object.entries(config.filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params[key] = value;
    }
  });

  return apiClient.get<{ articles: Article[]; articlesCount: number }>(
    '/articles' + (config.type === 'feed' ? '/feed' : ''),
    { params, signal },
  );
}

export async function getArticle(slug: string, signal?: AbortSignal): Promise<Article> {
  const data = await apiClient.get<{ article: Article }>(`/articles/${slug}`, { signal });
  return data.article;
}

export async function deleteArticle(slug: string): Promise<void> {
  await apiClient.delete<void>(`/articles/${slug}`);
}

export async function createArticle(article: Partial<Article>): Promise<Article> {
  const data = await apiClient.post<{ article: Article }>('/articles/', { article });
  return data.article;
}

export async function updateArticle(article: Partial<Article>): Promise<Article> {
  const data = await apiClient.put<{ article: Article }>(`/articles/${article.slug}`, { article });
  return data.article;
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const data = await apiClient.post<{ article: Article }>(`/articles/${slug}/favorite`, {});
  return data.article;
}

export async function unfavoriteArticle(slug: string): Promise<void> {
  await apiClient.delete<void>(`/articles/${slug}/favorite`);
}
