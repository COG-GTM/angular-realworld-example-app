import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticleMeta } from './ArticleMeta';
import { FavoriteButton } from './FavoriteButton';
import type { Article } from '../models';

export function ArticlePreview({ article: articleInput }: { article: Article }) {
  const [article, setArticle] = useState(articleInput);

  useEffect(() => setArticle(articleInput), [articleInput]);

  const toggleFavorite = (favorited: boolean) =>
    setArticle(current => ({
      ...current,
      favorited,
      favoritesCount: favorited ? current.favoritesCount + 1 : current.favoritesCount - 1,
    }));

  return (
    <div className="article-preview">
      <ArticleMeta article={article}>
        <FavoriteButton article={article} onToggle={toggleFavorite} className="pull-xs-right">
          {article.favoritesCount}
        </FavoriteButton>
      </ArticleMeta>

      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map(tag => (
            <li className="tag-default tag-pill tag-outline" key={tag}>
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
