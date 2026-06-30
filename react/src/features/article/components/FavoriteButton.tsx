import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../../../types';
import { ArticlesAPI } from '../../../api/agent';
import { useAuth } from '../../../auth/AuthContext';

export interface FavoriteButtonProps {
  article: Article;
  onToggle: (favorited: boolean) => void;
  children?: ReactNode;
}

/**
 * Favorite/unfavorite toggle. Mirrors Angular's FavoriteButtonComponent:
 * unauthenticated users are redirected to /register, otherwise the article's
 * favorite state is toggled via the API and reported back through onToggle.
 */
export function FavoriteButton({ article, onToggle, children }: FavoriteButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const className = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
  ]
    .filter(Boolean)
    .join(' ');

  const toggleFavorite = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/register');
      return;
    }

    try {
      if (article.favorited) {
        await ArticlesAPI.unfavorite(article.slug);
      } else {
        await ArticlesAPI.favorite(article.slug);
      }
      onToggle(!article.favorited);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button className={className} onClick={toggleFavorite}>
      <i className="ion-heart"></i> {children}
    </button>
  );
}
