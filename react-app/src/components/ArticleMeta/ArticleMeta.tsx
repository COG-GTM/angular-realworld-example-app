import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { defaultImage } from '../../utils/default-image';
import type { ReactNode } from 'react';

interface Props {
  article: Article;
  children?: ReactNode;
}

export function ArticleMeta({ article, children }: Props) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={defaultImage(article.author.image)} alt={article.author.username} />
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
