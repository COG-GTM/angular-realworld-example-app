import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articlesApi } from '../api/services';
import { LoadingState, type Article, type ArticleListConfig } from '../types';
import { ArticlePreview } from './ArticlePreview';

interface ArticleListProps {
  config: ArticleListConfig;
  limit: number;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}

export function ArticleList({ config, limit, currentPage, isFollowingFeed = false, onPageChange }: ArticleListProps) {
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(currentPage ?? 1);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);

  const configKey = JSON.stringify(config);

  // Reset to the first page when the query config changes (unless a page is driven externally).
  useEffect(() => {
    setPage(currentPage ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  useEffect(() => {
    if (currentPage) {
      setPage(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    let active = true;
    setLoading(LoadingState.LOADING);
    setResults([]);

    const query: ArticleListConfig = { ...config, filters: { ...config.filters } };
    if (limit) {
      query.filters.limit = limit;
      query.filters.offset = limit * (page - 1);
    }

    articlesApi
      .query(query)
      .then(data => {
        if (!active) return;
        setLoading(LoadingState.LOADED);
        setResults(data.articles);
        setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1));
      })
      .catch(() => {
        /* errors are handled globally; leave the list empty */
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, page, limit]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber !== page) {
      setPage(pageNumber);
      onPageChange?.(pageNumber);
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
                <li key={pageNumber} className={pageNumber === page ? 'page-item active' : 'page-item'}>
                  <button className="page-link" style={{ cursor: 'pointer' }} onClick={() => setPageTo(pageNumber)}>
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
