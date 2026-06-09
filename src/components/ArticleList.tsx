import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article, ArticleListConfig } from '../types';
import { LoadingState } from '../types';
import { articlesService } from '../services/articles';
import { ArticlePreview } from './ArticlePreview';

/**
 * Fetches and renders a paginated list of articles for a given config.
 * Port of the Angular ArticleListComponent (loading state, pagination,
 * empty-feed message). Cancels in-flight requests on unmount/refetch via
 * AbortController (replaces RxJS takeUntilDestroyed).
 */
export function ArticleList({
  config,
  limit,
  currentPage = 1,
  isFollowingFeed = false,
  onPageChange,
}: {
  config: ArticleListConfig;
  limit: number;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(currentPage);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState(LoadingState.NOT_LOADED);

  useEffect(() => {
    setPage(currentPage);
  }, [config, currentPage]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(LoadingState.LOADING);
    setResults([]);

    const query: ArticleListConfig = { ...config, filters: { ...config.filters } };
    if (limit) {
      query.filters.limit = limit;
      query.filters.offset = limit * (page - 1);
    }

    articlesService
      .query(query, controller.signal)
      .then(data => {
        setLoading(LoadingState.LOADED);
        setResults(data.articles);
        setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setLoading(LoadingState.LOADED);
      });

    return () => controller.abort();
  }, [config, page, limit]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber !== page) {
      setPage(pageNumber);
      onPageChange?.(pageNumber);
    }
  };

  if (loading === LoadingState.LOADING) {
    return <div className="article-preview">Loading articles...</div>;
  }

  if (loading !== LoadingState.LOADED) {
    return null;
  }

  return (
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
  );
}
