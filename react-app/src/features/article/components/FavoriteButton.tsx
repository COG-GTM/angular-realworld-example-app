import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../core/auth/services/user.service';
import { ArticlesService } from '../services/articles.service';
import type { Article } from '../models/article.model';

interface FavoriteButtonProps {
  article: Article;
  onToggle: (favorited: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export function FavoriteButton({ article, onToggle, children, className }: FavoriteButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  const toggleFavorite = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    try {
      if (!article.favorited) {
        await ArticlesService.favorite(article.slug);
      } else {
        await ArticlesService.unfavorite(article.slug);
      }
      setIsSubmitting(false);
      onToggle(!article.favorited);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm ${isSubmitting ? 'disabled' : ''} ${
        article.favorited ? 'btn-primary' : 'btn-outline-primary'
      } ${className || ''}`}
      onClick={toggleFavorite}
      disabled={isSubmitting}
    >
      <i className="ion-heart"></i> {children}
    </button>
  );
}
