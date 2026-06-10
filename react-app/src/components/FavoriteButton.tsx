import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../types';
import { useAuth } from '../hooks/useAuth';
import { favoriteArticle, unfavoriteArticle } from '../api/articles';

/**
 * Replaces the Angular `FavoriteButtonComponent`. Emits the new favorited state
 * via `onToggle`. Unauthenticated users are redirected to `/register`.
 */
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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      void navigate('/register');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!article.favorited) {
        await favoriteArticle(article.slug);
      } else {
        await unfavoriteArticle(article.slug);
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
