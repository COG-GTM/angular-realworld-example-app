import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../../types';
import { ArticleMeta } from '../ArticleMeta/ArticleMeta';
import { FavoriteButton } from '../FavoriteButton/FavoriteButton';

interface Props {
  article: Article;
}

export function ArticlePreview({ article: initialArticle }: Props) {
  const [article, setArticle] = useState(initialArticle);

  const handleToggleFavorite = (favorited: boolean) => {
    setArticle(prev => ({
      ...prev,
      favorited,
      favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
    }));
  };

  return (
    <div className="article-preview">
      <ArticleMeta article={article}>
        <FavoriteButton article={article} onToggle={handleToggleFavorite}>
          <span className="pull-xs-right">{article.favoritesCount}</span>
        </FavoriteButton>
      </ArticleMeta>

      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map(tag => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
