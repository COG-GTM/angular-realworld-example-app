import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Article } from '../models';

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
      navigate('/register');
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

  const buttonClass = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <app-favorite-button class={className}>
      <button className={buttonClass} onClick={() => void toggleFavorite()}>
        <i className="ion-heart"></i> {children}
      </button>
    </app-favorite-button>
  );
}
