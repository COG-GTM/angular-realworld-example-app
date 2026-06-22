import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import type { Article } from '../types';

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
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/register');
      return;
    }

    try {
      if (!article.favorited) {
        await articlesApi.favorite(article.slug);
      } else {
        await articlesApi.unfavorite(article.slug);
      }
      setIsSubmitting(false);
      onToggle(!article.favorited);
    } catch {
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
