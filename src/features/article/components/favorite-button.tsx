import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../models/article';
import { useIsAuthenticated } from '../../../core/auth/user-context';
import * as articlesService from '../services/articles.service';

export function FavoriteButton({
  article,
  onToggle,
  className,
  children,
}: {
  article: Article;
  onToggle: (favorited: boolean) => void;
  className?: string;
  children?: ReactNode;
}) {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!article.favorited) {
        await articlesService.favorite(article.slug);
      } else {
        await articlesService.unfavorite(article.slug);
      }
      setIsSubmitting(false);
      onToggle(!article.favorited);
    } catch {
      setIsSubmitting(false);
    }
  };

  const classes = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} onClick={toggleFavorite}>
      <i className="ion-heart"></i> {children}
    </button>
  );
}
