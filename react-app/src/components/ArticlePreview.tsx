import { Link } from 'react-router-dom';
import { Article } from '../models/article';
import FavoriteButton from './FavoriteButton';

interface Props {
  article: Article;
  onFavoriteToggle: (article: Article) => void;
}

function ArticlePreview({ article, onFavoriteToggle }: Props) {
  const defaultImage = 'https://api.realworld.io/images/smiley-cyrus.jpeg';

  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${article.author.username}`}>
          <img src={article.author.image || defaultImage} alt={article.author.username} />
        </Link>
        <div className="info">
          <Link to={`/profile/${article.author.username}`} className="author">
            {article.author.username}
          </Link>
          <span className="date">{new Date(article.createdAt).toDateString()}</span>
        </div>
        <FavoriteButton article={article} onToggle={onFavoriteToggle} compact />
      </div>
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li key={tag} className="tag-default tag-pill tag-outline">{tag}</li>
            ))}
          </ul>
        )}
      </Link>
    </div>
  );
}

export default ArticlePreview;
