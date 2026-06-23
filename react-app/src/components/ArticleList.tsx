import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Article, ArticleListConfig, LoadingState } from '../types';
import { articlesApi } from '../api/articles';
import { ArticlePreview } from './ArticlePreview';

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
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(LoadingState.LOADING);
    setResults([]);

    const query: ArticleListConfig = {
      ...config,
      filters: { ...config.filters },
    };
    if (limit) {
      query.filters.limit = limit;
      query.filters.offset = limit * (page - 1);
    }

    articlesApi.query(query).then(data => {
      if (cancelled) {
        return;
      }
      setLoading(LoadingState.LOADED);
      setResults(data.articles);
      setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1));
    });

    return () => {
      cancelled = true;
    };
  }, [config, limit, page]);

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
        results.map(article => <ArticlePreview key={article.slug} articleInput={article} />)
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
