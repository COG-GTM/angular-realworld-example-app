import { Link } from "react-router-dom";
import { Article } from "../../models/article.model";
import { FavoriteButton } from "./FavoriteButton";

interface ArticlePreviewProps {
  article: Article;
  onFavoriteToggle: (article: Article) => void;
}

function defaultImage(image: string | null | undefined): string {
  return image || "/realworld/assets/media/default-avatar.svg";
}

export function ArticlePreview({
  article,
  onFavoriteToggle,
}: ArticlePreviewProps) {
  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${article.author.username}`}>
          <img
            src={defaultImage(article.author.image)}
            alt={article.author.username}
          />
        </Link>
        <div className="info">
          <Link
            to={`/profile/${article.author.username}`}
            className="author"
          >
            {article.author.username}
          </Link>
          <span className="date">
            {new Date(article.createdAt).toDateString()}
          </span>
        </div>
        <div className="pull-xs-right">
          <FavoriteButton
            article={article}
            onToggle={onFavoriteToggle}
          >
            {" "}
            {article.favoritesCount}
          </FavoriteButton>
        </div>
      </div>
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li
                key={tag}
                className="tag-default tag-pill tag-outline"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </div>
  );
}
