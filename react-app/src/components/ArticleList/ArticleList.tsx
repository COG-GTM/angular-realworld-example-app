import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article, ArticleListConfig } from '../../types';
import { queryArticles } from '../../services/articles.service';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';

interface Props {
  config: ArticleListConfig;
  limit?: number;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}

export function ArticleList({
  config,
  limit = 10,
  currentPage = 1,
  isFollowingFeed = false,
  onPageChange,
}: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setArticles([]);

    const query: ArticleListConfig = {
      ...config,
      filters: {
        ...config.filters,
        limit,
        offset: limit * (currentPage - 1),
      },
    };

    queryArticles(query, controller.signal)
      .then(data => {
        setArticles(data.articles);
        setTotalPages(
          Array.from(new Array(Math.ceil(data.articlesCount / limit)), (_, i) => i + 1),
        );
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [config, limit, currentPage]);

  if (loading) {
    return <div className="article-preview">Loading articles...</div>;
  }

  if (articles.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {articles.map(article => (
        <ArticlePreview key={article.slug} article={article} />
      ))}

      <nav>
        <ul className="pagination">
          {totalPages.map(pageNumber => (
            <li
              key={pageNumber}
              className={`page-item${pageNumber === currentPage ? ' active' : ''}`}
            >
              <button
                className="page-link"
                onClick={() => onPageChange?.(pageNumber)}
                style={{ cursor: 'pointer' }}
              >
                {pageNumber}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
