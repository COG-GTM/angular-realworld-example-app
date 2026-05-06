import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArticlesService } from '../services/articles.service';
import type { ArticleListConfig } from '../models/article-list-config.model';
import type { Article } from '../models/article.model';
import { ArticlePreview } from './ArticlePreview';
import { LoadingState } from '../../../core/models/loading-state.model';

interface ArticleListProps {
  limit: number;
  config: ArticleListConfig;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}

export function ArticleList({ limit, config, currentPage = 1, isFollowingFeed = false, onPageChange }: ArticleListProps) {
  const [results, setResults] = useState<Article[]>([]);
  const [page, setPage] = useState(currentPage);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState<LoadingState>(LoadingState.NOT_LOADED);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setLoading(LoadingState.LOADING);
    setResults([]);

    const query: ArticleListConfig = {
      ...config,
      filters: {
        ...config.filters,
        limit,
        offset: limit * (page - 1),
      },
    };

    ArticlesService.query(query).then((data) => {
      setLoading(LoadingState.LOADED);
      setResults(data.articles);
      setTotalPages(
        Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, index) => index + 1),
      );
    }).catch(() => {
      setLoading(LoadingState.LOADED);
      setResults([]);
    });
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
          {results.length === 0 ? (
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
          ) : (
            results.map((article) => <ArticlePreview key={article.slug} article={article} />)
          )}

          <nav>
            <ul className="pagination">
              {totalPages.map((pageNumber) => (
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
