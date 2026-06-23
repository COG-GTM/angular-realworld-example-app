import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';
import { defaultImage, longDate } from '../utils/format';

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
