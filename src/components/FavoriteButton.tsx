import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../types/article';
import { articlesService } from '../services/articles';
import { useAuth } from '../auth/AuthContext';

interface FavoriteButtonProps {
  article: Article;
  onToggle: (favorited: boolean) => void;
  className?: string;
  children?: ReactNode;
}

export function FavoriteButton({ article, onToggle, className, children }: FavoriteButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
      onToggle(!article.favorited);
    } catch {
      // Swallow errors — the app should not crash on a failed favorite toggle.
    } finally {
      setIsSubmitting(false);
    }
  };

  const classNames = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} onClick={toggleFavorite}>
      <i className="ion-heart"></i> {children}
    </button>
  );
}
