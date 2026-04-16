import { api } from './api';
import { Article, ArticleListConfig } from '../models/article';

interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export async function getArticles(config: ArticleListConfig): Promise<ArticlesResponse> {
  const params = new URLSearchParams();
  Object.entries(config.filters).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  const endpoint = config.type === 'feed' ? '/articles/feed' : '/articles';
  const query = params.toString();
  return api.get<ArticlesResponse>(`${endpoint}${query ? '?' + query : ''}`);
}

export async function getArticle(slug: string): Promise<Article> {
  const data = await api.get<{ article: Article }>(`/articles/${slug}`);
  return data.article;
}

export async function createArticle(article: Partial<Article>): Promise<Article> {
  const data = await api.post<{ article: Article }>('/articles', { article });
  return data.article;
}

export async function updateArticle(slug: string, article: Partial<Article>): Promise<Article> {
  const data = await api.put<{ article: Article }>(`/articles/${slug}`, { article });
  return data.article;
}

export async function deleteArticle(slug: string): Promise<void> {
  await api.del<void>(`/articles/${slug}`);
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const data = await api.post<{ article: Article }>(`/articles/${slug}/favorite`);
  return data.article;
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  const data = await api.del<{ article: Article }>(`/articles/${slug}/favorite`);
  return data.article;
}
