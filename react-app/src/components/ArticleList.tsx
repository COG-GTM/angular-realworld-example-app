import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticlePreview } from './ArticlePreview';
import { articlesApi } from '../services/api';
import { LoadingState, type Article, type ArticleListConfig } from '../models';
import './ArticleList.css';

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
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);
  const [page, setPage] = useState(currentPage);
  const configKey = JSON.stringify({ type: config.type, filters: config.filters });

  useEffect(() => {
    setPage(currentPage);
  }, [configKey, currentPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(LoadingState.LOADING);
    setResults([]);

    const query: ArticleListConfig = {
      type: config.type,
      filters: { ...config.filters, limit, offset: limit * (page - 1) },
    };

    articlesApi
      .query(query)
      .then(data => {
        if (cancelled) return;
        setLoading(LoadingState.LOADED);
        setResults(data.articles);
        setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1));
      })
      .catch(() => {
        if (!cancelled) setLoading(LoadingState.LOADED);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, page, limit]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber === page) return;
    setPage(pageNumber);
    onPageChange?.(pageNumber);
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
        results.map(article => <ArticlePreview article={article} key={article.slug} />)
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
            <li className={pageNumber === page ? 'page-item active' : 'page-item'} key={pageNumber}>
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
