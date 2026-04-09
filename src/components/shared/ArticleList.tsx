import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArticleListConfig, Article } from "../../models/article.model";
import { ArticlesService } from "../../services/articles.service";
import { ArticlePreview } from "./ArticlePreview";

interface ArticleListProps {
  config: ArticleListConfig;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

const ARTICLES_PER_PAGE = 10;

export function ArticleList({
  config,
  currentPage: externalPage,
  onPageChange: externalPageChange,
  emptyMessage,
}: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [internalPage, setInternalPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const currentPage = externalPage ?? internalPage;

  useEffect(() => {
    if (!externalPage) setInternalPage(1);
    loadArticles(externalPage ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type, config.filters.tag, config.filters.author, config.filters.favorited, externalPage]);

  const loadArticles = async (page: number) => {
    setLoading(true);
    try {
      const result = await ArticlesService.query({
        ...config,
        filters: {
          ...config.filters,
          limit: ARTICLES_PER_PAGE,
          offset: (page - 1) * ARTICLES_PER_PAGE,
        },
      });
      setArticles(result.articles);
      setArticlesCount(result.articlesCount);
    } catch {
      setArticles([]);
      setArticlesCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (updated: Article) => {
    setArticles((prev) =>
      prev.map((a) => (a.slug === updated.slug ? updated : a)),
    );
  };

  const handlePageChange = (page: number) => {
    if (externalPageChange) {
      externalPageChange(page);
    } else {
      setInternalPage(page);
      loadArticles(page);
    }
  };

  const totalPages = Math.ceil(articlesCount / ARTICLES_PER_PAGE);

  if (loading) {
    return <div className="article-preview">Loading articles...</div>;
  }

  if (articles.length === 0) {
    if (emptyMessage === "feed") {
      return (
        <div className="empty-feed-message">
          Your feed is empty. Check out the <Link to="/">Global Feed</Link> to find articles.
        </div>
      );
    }
    if (emptyMessage) {
      return <div className="empty-feed-message">{emptyMessage}</div>;
    }
    return <div className="article-preview">No articles are here... yet.</div>;
  }

  return (
    <>
      {articles.map((article) => (
        <ArticlePreview
          key={article.slug}
          article={article}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}

      {totalPages > 1 && (
        <nav>
          <ul className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <li
                  key={page}
                  className={`page-item ${currentPage === page ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
    </>
  );
}
