import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article, ArticleListConfig } from '../../types';
import { LoadingState } from '../../types';
import { articlesService } from '../../services/articles';
import { ArticlePreview } from './ArticlePreview';

interface Props {
  limit: number;
  config: ArticleListConfig;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}

export function ArticleList({ limit, config, currentPage = 1, isFollowingFeed = false, onPageChange }: Props) {
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(currentPage || 1);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);

  useEffect(() => {
    setPage(currentPage || 1);
  }, [currentPage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(LoadingState.LOADING);
    setResults([]);

    const filters = { ...config.filters };
    if (limit) {
      filters.limit = limit;
      filters.offset = limit * (page - 1);
    }

    articlesService
      .query({ ...config, filters })
      .then(data => {
        if (cancelled) return;
        const articles = Array.isArray(data?.articles) ? data.articles : [];
        const count = typeof data?.articlesCount === 'number' ? data.articlesCount : 0;
        setLoading(LoadingState.LOADED);
        setResults(articles);
        setTotalPages(Array.from(new Array(Math.ceil(count / limit)), (_, index) => index + 1));
      })
      .catch(() => {
        if (!cancelled) setLoading(LoadingState.LOADED);
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
                <>No articles are here... yet.</>
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
