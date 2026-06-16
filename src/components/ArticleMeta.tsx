import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types/article';
import { defaultImage } from '../utils/image';
import { longDate } from '../utils/date';

/**
 * Author avatar + name + date block. `children` slot (Angular `<ng-content>`)
 * renders action buttons (favorite/follow/edit/delete) on the right.
 */
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
        <span className="date">{longDate(article.createdAt)}</span>
      </div>

      {children}
    </div>
  );
}
