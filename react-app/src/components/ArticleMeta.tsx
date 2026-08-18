import { Link } from 'react-router-dom';
import { defaultImage, longDate } from '../utils/format';
import type { Article } from '../models';
import type { ReactNode } from 'react';

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
