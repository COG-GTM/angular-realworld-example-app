import { Link } from 'react-router-dom';
import type { Article } from '../models/article.model';
import { defaultImage } from '../../../shared/pipes/default-image';
import type { ReactNode } from 'react';

interface ArticleMetaProps {
  article: Article;
  children?: ReactNode;
}

export function ArticleMeta({ article, children }: ArticleMetaProps) {
  const dateStr = new Date(article.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={defaultImage(article.author.image)} />
      </Link>

      <div className="info">
        <Link className="author" to={`/profile/${article.author.username}`}>
          {article.author.username}
        </Link>
        <span className="date">{dateStr}</span>
      </div>

      {children}
    </div>
  );
}
