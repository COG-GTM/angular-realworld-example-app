import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../../types';
import { articlesService } from '../../services/articles';
import { useAuth } from '../../context/AuthContext';

interface Props {
  article: Article;
  onToggle: (favorited: boolean) => void;
  className?: string;
  children?: ReactNode;
}

export function FavoriteButton({ article, onToggle, className, children }: Props) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFavorite = async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      void navigate('/register');
      return;
    }

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
