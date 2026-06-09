import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { defaultImage, formatDate } from '../utils/format';

/**
 * Author avatar + name + date block. `children` replaces Angular's <ng-content>
 * (used to slot in favorite/follow buttons).
 */
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
        <span className="date">{formatDate(article.createdAt, 'longDate')}</span>
      </div>

      {children}
    </div>
  );
}
