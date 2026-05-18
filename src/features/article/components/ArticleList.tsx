import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../../models/article.model';
import type { ArticleListConfig } from '../../../models/article.model';
import { articlesService } from '../../../services/articles.service';
import { ArticlePreview } from './ArticlePreview';

type LoadingState = 'NOT_LOADED' | 'LOADING' | 'LOADED';

export function ArticleList({
  limit,
  config,
  currentPage = 1,
  isFollowingFeed = false,
  onPageChange,
}: {
  limit: number;
  config: ArticleListConfig;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(currentPage);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>('NOT_LOADED');

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading('LOADING');
    setResults([]);

    const query: ArticleListConfig = {
      ...config,
      filters: {
        ...config.filters,
        limit,
        offset: limit * (page - 1),
      },
    };

    articlesService.query(query).then(data => {
      if (cancelled) return;
      setLoading('LOADED');
      setResults(data.articles);
      setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1));
    });

    return () => {
      cancelled = true;
    };
  }, [config, page, limit]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber !== page) {
      setPage(pageNumber);
      onPageChange?.(pageNumber);
    }
  };

  if (loading === 'LOADING') {
    return <div className="article-preview">Loading articles...</div>;
  }

  return (
    <>
      {results.length === 0 && loading === 'LOADED' && (
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

      {results.map(article => (
        <ArticlePreview key={article.slug} articleInput={article} />
      ))}

      {totalPages.length > 1 && (
        <nav>
          <ul className="pagination">
            {totalPages.map(pageNumber => (
              <li key={pageNumber} className={`page-item ${pageNumber === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPageTo(pageNumber)} style={{ cursor: 'pointer' }}>
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
