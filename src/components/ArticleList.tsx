import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as articlesApi from '../api/articles';
import type { Article, ArticleListConfig } from '../types/article';
import { ArticlePreview } from './ArticlePreview';
import { cx } from '../utils/cx';

type LoadingState = 'NOT_LOADED' | 'LOADING' | 'LOADED';

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/**
 * Paginated list of article previews.
 *
 * Page is "controlled" when `currentPage` is supplied (Home drives it from the
 * URL); otherwise it's tracked internally (profile tabs). `onPageChange` lets the
 * parent sync the URL.
 */
export function ArticleList({
  config,
  limit,
  currentPage,
  isFollowingFeed = false,
  onPageChange,
}: {
  config: ArticleListConfig;
  limit: number;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const controlled = currentPage !== undefined;
  const [internalPage, setInternalPage] = useState(1);
  const page = controlled ? (currentPage as number) : internalPage;

  const [results, setResults] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>('NOT_LOADED');

  const requestId = useRef(0);
  const configKey = `${config.type}|${config.filters.tag ?? ''}|${config.filters.author ?? ''}|${
    config.filters.favorited ?? ''
  }`;

  useEffect(() => {
    const id = ++requestId.current;
    setLoading('LOADING');
    setResults([]);

    const filters = { ...config.filters };
    if (limit) {
      filters.limit = limit;
      filters.offset = limit * (page - 1);
    }

    articlesApi
      .query({ type: config.type, filters })
      .then(data => {
        if (id !== requestId.current) return;
        setResults(data.articles);
        setTotalPages(range(Math.ceil(data.articlesCount / limit)));
        setLoading('LOADED');
      })
      .catch(() => {
        if (id !== requestId.current) return;
        // Stay graceful on error (server 5xx / network): show empty state.
        setResults([]);
        setTotalPages([]);
        setLoading('LOADED');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, page, limit]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber === page) return;
    onPageChange?.(pageNumber);
    if (!controlled) {
      setInternalPage(pageNumber);
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
                <li key={pageNumber} className={cx('page-item', { active: pageNumber === page })}>
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
