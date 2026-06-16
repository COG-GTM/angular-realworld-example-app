import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types/article';
import type { ArticleListConfig } from '../types/article-list-config';
import { articlesService } from '../services/articles';
import { ArticlePreview } from './ArticlePreview';

type LoadingState = 'NOT_LOADED' | 'LOADING' | 'LOADED';

interface ArticleListProps {
  limit: number;
  config: ArticleListConfig;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}

export function ArticleList({
  limit,
  config,
  currentPage = 1,
  isFollowingFeed = false,
  onPageChange,
}: ArticleListProps) {
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(currentPage);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>('NOT_LOADED');

  // Reset to page 1 (or the externally provided page) whenever the config changes,
  // mirroring the Angular ngOnChanges behaviour.
  const prevConfigRef = useRef(config);
  useEffect(() => {
    if (prevConfigRef.current !== config) {
      prevConfigRef.current = config;
      setPage(currentPage || 1);
    }
  }, [config, currentPage]);

  // Follow an externally controlled current page.
  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  // Fetch whenever the effective query (config + page + limit) changes.
  useEffect(() => {
    let cancelled = false;
    setLoading('LOADING');
    setResults([]);

    const offset = limit * (page - 1);
    const queryConfig: ArticleListConfig = {
      type: config.type,
      filters: { ...config.filters, ...(limit ? { limit, offset } : {}) },
    };

    articlesService
      .query(queryConfig)
      .then(data => {
        if (cancelled) return;
        setLoading('LOADED');
        setResults(data.articles);
        setTotalPages(limit ? Array.from({ length: Math.ceil(data.articlesCount / limit) }, (_, i) => i + 1) : []);
      })
      .catch(() => {
        if (cancelled) return;
        // Never crash the page on a failed feed load — show an empty, loaded state.
        setLoading('LOADED');
        setResults([]);
        setTotalPages([]);
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

  return (
    <>
      {loading === 'LOADING' && <div className="article-preview">Loading articles...</div>}

      {loading === 'LOADED' && (
        <>
          {results.length > 0 ? (
            results.map(article => <ArticlePreview key={article.slug} article={article} />)
          ) : (
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

          <nav>
            <ul className="pagination">
              {totalPages.map(pageNumber => (
                <li key={pageNumber} className={`page-item${pageNumber === page ? ' active' : ''}`}>
                  <button className="page-link" onClick={() => setPageTo(pageNumber)}>
                    {pageNumber}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
