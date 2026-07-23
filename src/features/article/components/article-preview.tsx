import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../models/article';
import { ArticleMeta } from './article-meta';
import { FavoriteButton } from './favorite-button';

export function ArticlePreview({ article: articleInput }: { article: Article }) {
  const [article, setArticle] = useState<Article>(articleInput);

  useEffect(() => {
    setArticle(articleInput);
  }, [articleInput]);

  const toggleFavorite = (favorited: boolean) => {
    setArticle(prev => ({
      ...prev,
      favorited,
      favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
    }));
  };

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
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}
