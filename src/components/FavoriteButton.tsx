import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as articlesApi from '../api/articles';
import type { Article } from '../types/article';
import { cx } from '../utils/cx';

/**
 * Favorite/unfavorite toggle. Unauthenticated users are sent to /register.
 * Emits the new favorited state via `onToggle` so the parent can update counts.
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
  const { isAuthenticated } = useAuth();
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
        await articlesApi.favorite(article.slug);
      } else {
        await articlesApi.unfavorite(article.slug);
      }
      onToggle(!article.favorited);
    } catch {
      // Swallow: keep the UI responsive on failure (matches Angular behavior).
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={cx(
        'btn',
        'btn-sm',
        {
          disabled: isSubmitting,
          'btn-outline-primary': !article.favorited,
          'btn-primary': article.favorited,
        },
        className,
      )}
      onClick={toggleFavorite}
    >
      <i className="ion-heart"></i> {children}
    </button>
  );
}
