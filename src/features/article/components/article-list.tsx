import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticleListConfig } from '../models/article-list-config';
import { Article } from '../models/article';
import { ArticlePreview } from './article-preview';
import { LoadingState } from '../../../core/models/loading-state';
import * as articlesService from '../services/articles.service';

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
  const controlled = onPageChange != null;
  const [internalPage, setInternalPage] = useState(1);
  const page = controlled ? currentPage || 1 : internalPage;

  const [results, setResults] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);

  useEffect(() => {
    let active = true;
    setLoading(LoadingState.LOADING);
    setResults([]);

    const query: ArticleListConfig = { ...config, filters: { ...config.filters } };
    if (limit) {
      query.filters.limit = limit;
      query.filters.offset = limit * (page - 1);
    }

    articlesService
      .query(query)
      .then(data => {
        if (!active) {
          return;
        }
        setLoading(LoadingState.LOADED);
        setResults(data.articles);
        setTotalPages(Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1));
      })
      .catch(() => {
        if (active) {
          setLoading(LoadingState.LOADED);
        }
      });

    return () => {
      active = false;
    };
  }, [config, page, limit]);

  const setPageTo = (pageNumber: number) => {
    if (pageNumber !== page) {
      if (controlled) {
        onPageChange?.(pageNumber);
      } else {
        setInternalPage(pageNumber);
      }
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
                <li key={pageNumber} className={'page-item' + (pageNumber === page ? ' active' : '')}>
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
