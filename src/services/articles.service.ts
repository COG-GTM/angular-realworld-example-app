import api from "./api";
import { Article, ArticleListConfig } from "../models/article.model";

interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

export const ArticlesService = {
  query(config: ArticleListConfig): Promise<ArticlesResponse> {
    const endpoint = config.type === "feed" ? "/articles/feed" : "/articles";
    return api.get(endpoint, { params: config.filters }).then((r) => r.data);
  },

  get(slug: string): Promise<Article> {
    return api.get(`/articles/${slug}`).then((r) => r.data.article);
  },

  create(article: Partial<Article>): Promise<Article> {
    return api.post("/articles", { article }).then((r) => r.data.article);
  },

  update(article: Partial<Article> & { slug: string }): Promise<Article> {
    return api
      .put(`/articles/${article.slug}`, { article })
      .then((r) => r.data.article);
  },

  delete(slug: string): Promise<void> {
    return api.delete(`/articles/${slug}`);
  },

  favorite(slug: string): Promise<Article> {
    return api
      .post(`/articles/${slug}/favorite`)
      .then((r) => r.data.article);
  },

  unfavorite(slug: string): Promise<Article> {
    return api
      .delete(`/articles/${slug}/favorite`)
      .then((r) => r.data.article);
  },
};
