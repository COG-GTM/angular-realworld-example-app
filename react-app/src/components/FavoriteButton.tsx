import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Article } from '../types';
import { articlesApi } from '../api/articles';
import { useAuth } from '../auth/AuthContext';

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

  const classes = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={className ? `${classes} ${className}` : classes} onClick={toggleFavorite}>
      <i className="ion-heart"></i> {children}
    </button>
  );
}
