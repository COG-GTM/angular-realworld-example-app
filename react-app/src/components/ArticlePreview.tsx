import { Link } from 'react-router-dom';
import { Article } from '../models';
import { FavoriteButton } from './FavoriteButton';

const DEFAULT_IMAGE = 'https://api.realworld.io/images/smiley-cyrus.jpeg';

interface ArticlePreviewProps {
  article: Article;
  onFavoriteToggle?: (article: Article) => void;
}

export function ArticlePreview({ article, onFavoriteToggle }: ArticlePreviewProps) {
  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${article.author.username}`}>
          <img src={article.author.image || DEFAULT_IMAGE} alt={article.author.username} />
        </Link>
        <div className="info">
          <Link to={`/profile/${article.author.username}`} className="author">
            {article.author.username}
          </Link>
          <span className="date">{new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <FavoriteButton
          article={article}
          compact
          onToggle={onFavoriteToggle}
        />
      </div>
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li key={tag} className="tag-default tag-pill tag-outline">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </div>
  );
}
