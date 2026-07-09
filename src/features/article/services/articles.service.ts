import { api } from '../../../core/api/api-client';
import { ArticleListConfig } from '../models/article-list-config';
import { Article } from '../models/article';

export async function query(config: ArticleListConfig): Promise<{ articles: Article[]; articlesCount: number }> {
  const url = '/articles' + (config.type === 'feed' ? '/feed' : '');
  const { data } = await api.get<{ articles: Article[]; articlesCount: number }>(url, {
    params: { ...config.filters },
  });
  return data;
}

export async function getArticle(slug: string): Promise<Article> {
  const { data } = await api.get<{ article: Article }>(`/articles/${slug}`);
  return data.article;
}

export async function deleteArticle(slug: string): Promise<void> {
  await api.delete<void>(`/articles/${slug}`);
}

export async function createArticle(article: Partial<Article>): Promise<Article> {
  const { data } = await api.post<{ article: Article }>('/articles/', { article });
  return data.article;
}

export async function updateArticle(article: Partial<Article>): Promise<Article> {
  const { data } = await api.put<{ article: Article }>(`/articles/${article.slug}`, { article });
  return data.article;
}

export async function favorite(slug: string): Promise<Article> {
  const { data } = await api.post<{ article: Article }>(`/articles/${slug}/favorite`, {});
  return data.article;
}

export async function unfavorite(slug: string): Promise<void> {
  await api.delete<void>(`/articles/${slug}/favorite`);
}
