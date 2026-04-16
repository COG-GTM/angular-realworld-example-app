import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Article, ArticleListConfig } from '../models/article';
import { getArticles, favoriteArticle, unfavoriteArticle } from '../services/articles.service';
import ArticlePreview from './ArticlePreview';

interface Props {
  config: ArticleListConfig;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const LIMIT = 10;

function ArticleList({ config, currentPage, onPageChange }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const filters = { ...config.filters, limit: LIMIT, offset: (currentPage - 1) * LIMIT };
    getArticles({ ...config, filters })
      .then((data) => {
        if (!cancelled) {
          setArticles(data.articles);
          setArticlesCount(data.articlesCount);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [config, currentPage]);

  const handleFavoriteToggle = useCallback(async (article: Article) => {
    try {
      const updated = article.favorited
        ? await unfavoriteArticle(article.slug)
        : await favoriteArticle(article.slug);
      setArticles((prev) => prev.map((a) => (a.slug === updated.slug ? updated : a)));
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  }, []);

  if (loading) return <div className="article-preview">Loading articles...</div>;
  if (articles.length === 0) {
    return (
      <div className="article-preview empty-feed-message">
        {config.type === 'feed' ? (
          <>Your feed is empty. <Link to="/">Check out the Global Feed.</Link></>
        ) : (
          'No articles are here... yet.'
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(articlesCount / LIMIT);

  return (
    <>
      {articles.map((article) => (
        <ArticlePreview key={article.slug} article={article} onFavoriteToggle={handleFavoriteToggle} />
      ))}
      {totalPages > 1 && (
        <nav>
          <ul className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(page)}>{page}</button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

export default ArticleList;
