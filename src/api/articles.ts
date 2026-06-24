import type { Article, ArticleListConfig } from '../types';
import { requests } from './agent';

function buildParams(config: ArticleListConfig): string {
  const params = new URLSearchParams();
  const filters = config.filters;
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.author) params.set('author', filters.author);
  if (filters.favorited) params.set('favorited', filters.favorited);
  if (filters.limit != null) params.set('limit', String(filters.limit));
  if (filters.offset != null) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function queryArticles(
  config: ArticleListConfig,
): Promise<{ articles: Article[]; articlesCount: number }> {
  const path = '/articles' + (config.type === 'feed' ? '/feed' : '') + buildParams(config);
  return requests.get(path);
}

export async function getArticle(slug: string): Promise<Article> {
  const data = await requests.get<{ article: Article }>(`/articles/${slug}`);
  return data.article;
}

export async function createArticle(article: Partial<Article>): Promise<Article> {
  const data = await requests.post<{ article: Article }>('/articles/', {
    article,
  });
  return data.article;
}

export async function updateArticle(article: Partial<Article> & { slug: string }): Promise<Article> {
  const data = await requests.put<{ article: Article }>(`/articles/${article.slug}`, { article });
  return data.article;
}

export async function deleteArticle(slug: string): Promise<void> {
  await requests.del(`/articles/${slug}`);
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const data = await requests.post<{ article: Article }>(`/articles/${slug}/favorite`, {});
  return data.article;
}

export async function unfavoriteArticle(slug: string): Promise<void> {
  await requests.del(`/articles/${slug}/favorite`);
}
