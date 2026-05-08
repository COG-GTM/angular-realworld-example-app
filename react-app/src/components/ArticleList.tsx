import { useState, useEffect } from 'react';
import { Article, ArticleListConfig } from '../models';
import { Articles } from '../services/api';
import { ArticlePreview } from './ArticlePreview';
import { Pagination } from './Pagination';

interface ArticleListProps {
  config: ArticleListConfig;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function ArticleList({ config, currentPage, onPageChange }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = config.filters.limit || 10;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = {
      ...config.filters,
      limit,
      offset: (currentPage - 1) * limit,
    };

    const fetchFn = config.type === 'feed' ? Articles.feed : Articles.all;
    fetchFn(params)
      .then((data) => {
        setArticles(data.articles);
        setArticlesCount(data.articlesCount);
      })
      .catch(() => {
        setArticles([]);
        setArticlesCount(0);
      })
      .finally(() => setLoading(false));
  }, [config, currentPage, limit]);

  const handleFavoriteToggle = (updated: Article) => {
    setArticles((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a))
    );
  };

  if (loading) {
    return <div className="article-preview">Loading articles...</div>;
  }

  if (articles.length === 0) {
    return <div className="article-preview">No articles are here... yet.</div>;
  }

  const totalPages = Math.ceil(articlesCount / limit);

  return (
    <>
      {articles.map((article) => (
        <ArticlePreview
          key={article.slug}
          article={article}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
