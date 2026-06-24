import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article, ArticleListConfig } from '../types';
import { queryArticles } from '../api';
import { ArticlePreview } from './ArticlePreview';

interface ArticleListProps {
  config: ArticleListConfig;
  limit?: number;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}

export function ArticleList({
  config,
  limit = 10,
  currentPage = 1,
  isFollowingFeed = false,
  onPageChange,
}: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setArticles([]);

    const query: ArticleListConfig = {
      ...config,
      filters: {
        ...config.filters,
        limit,
        offset: limit * (currentPage - 1),
      },
    };

    queryArticles(query).then(data => {
      if (cancelled) return;
      setArticles(data.articles);
      setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, i) => i + 1));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [config, limit, currentPage]);

  if (loading) {
    return <div className="article-preview">Loading articles...</div>;
  }

  return (
    <>
      {articles.length === 0 && (
        <div className="article-preview empty-feed-message">
          {isFollowingFeed ? (
            <>
              Your feed is empty. Follow some users to see their articles here, or check out the{' '}
              <Link to="/">Global Feed</Link>!
            </>
          ) : (
            'No articles are here... yet.'
          )}
        </div>
      )}

      {articles.map(article => (
        <ArticlePreview key={article.slug} article={article} />
      ))}

      {totalPages.length > 1 && (
        <nav>
          <ul className="pagination">
            {totalPages.map(pageNumber => (
              <li key={pageNumber} className={`page-item${pageNumber === currentPage ? ' active' : ''}`}>
                <button className="page-link" style={{ cursor: 'pointer' }} onClick={() => onPageChange?.(pageNumber)}>
                  {pageNumber}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
