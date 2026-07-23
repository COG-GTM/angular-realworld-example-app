import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../models/article';
import { defaultImage } from '../../../shared/default-image';
import { longDate } from '../../../shared/format-date';

export function ArticleMeta({ article, children }: { article: Article; children?: ReactNode }) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={defaultImage(article.author.image)} />
      </Link>

      <div className="info">
        <Link className="author" to={`/profile/${article.author.username}`}>
          {article.author.username}
        </Link>
        <span className="date">{longDate(article.createdAt)}</span>
      </div>

      {children}
    </div>
  );
}
