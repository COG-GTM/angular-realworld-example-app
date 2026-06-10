import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article, ArticleListConfig } from '../types';
import { LoadingState } from '../types';
import { queryArticles } from '../api/articles';
import { ArticlePreview } from './ArticlePreview';

/**
 * Replaces the Angular `ArticleListComponent`. Handles loading state, the empty
 * feed message, and pagination. `onPageChange` mirrors the Angular `pageChange`
 * output (only the home page wires it up; profile tabs paginate internally).
 */
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);
  const abortRef = useRef<AbortController | null>(null);

  const runQuery = (targetPage: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(LoadingState.LOADING);
    setResults([]);

    const filters = { ...config.filters };
    if (limit) {
      filters.limit = limit;
      filters.offset = limit * (targetPage - 1);
    }

    queryArticles({ type: config.type, filters }, controller.signal)
      .then(data => {
        setLoading(LoadingState.LOADED);
        setResults(data.articles);
        setTotalPages(
          limit ? Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1) : [],
        );
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setLoading(LoadingState.LOADED);
      });
  };

  useEffect(() => {
    setPage(currentPage);
    runQuery(currentPage);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, currentPage]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber !== page) {
      setPage(pageNumber);
      onPageChange?.(pageNumber);
      runQuery(pageNumber);
    }
  };

  return (
    <>
      {loading === LoadingState.LOADING && <div className="article-preview">Loading articles...</div>}

      {loading === LoadingState.LOADED && (
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
