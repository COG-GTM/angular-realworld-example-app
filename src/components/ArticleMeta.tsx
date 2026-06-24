import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';
import { defaultImage, formatDate } from '../utils';

interface ArticleMetaProps {
  article: Article;
  children?: ReactNode;
}

export function ArticleMeta({ article, children }: ArticleMetaProps) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={defaultImage(article.author.image)} />
      </Link>

      <div className="info">
        <Link className="author" to={`/profile/${article.author.username}`}>
          {article.author.username}
        </Link>
        <span className="date">{formatDate(article.createdAt)}</span>
      </div>

      {children}
    </div>
  );
}
