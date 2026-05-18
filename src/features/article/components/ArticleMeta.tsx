import { Link } from 'react-router-dom';
import type { Article } from '../../../models/article.model';
import { defaultImage } from '../../../utils/defaultImage';
import type { ReactNode } from 'react';

export function ArticleMeta({ article, children }: { article: Article; children?: ReactNode }) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={defaultImage(article.author.image)} alt="" />
      </Link>
      <div className="info">
        <Link className="author" to={`/profile/${article.author.username}`}>
          {article.author.username}
        </Link>
        <span className="date">
          {new Date(article.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
      {children}
    </div>
  );
}
