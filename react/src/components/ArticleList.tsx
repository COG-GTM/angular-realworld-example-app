import { useEffect, useState } from 'react';
import { articlesApi } from '../api/services';
import type { Article, ArticleListConfig } from '../types';
import { ArticlePreview } from './ArticlePreview';

const LIMIT = 10;

export function ArticleList({ config }: { config: ArticleListConfig }) {
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [articlesCount, setArticlesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    setArticles(null);
    setError(false);
    articlesApi
      .query({
        ...config,
        filters: { ...config.filters, limit: LIMIT, offset: (currentPage - 1) * LIMIT },
      })
      .then(data => {
        if (cancelled) return;
        setArticles(data.articles);
        setArticlesCount(data.articlesCount);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [config, currentPage]);

  const replaceArticle = (updated: Article) => {
    setArticles(prev => (prev ? prev.map(a => (a.slug === updated.slug ? updated : a)) : prev));
  };

  if (error) {
    return <div className="article-preview">Failed to load articles.</div>;
  }
  if (articles === null) {
    return <div className="article-preview">Loading articles...</div>;
  }
  if (articles.length === 0) {
    return <div className="article-preview">No articles are here... yet.</div>;
  }

  const totalPages = Math.ceil(articlesCount / LIMIT);

  return (
    <>
      {articles.map(article => (
        <ArticlePreview key={article.slug} article={article} onToggle={replaceArticle} />
      ))}

      {totalPages > 1 && (
        <nav>
          <ul className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button type="button" className="page-link" onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
