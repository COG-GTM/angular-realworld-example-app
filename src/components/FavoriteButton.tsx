import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { favoriteArticle, unfavoriteArticle } from '../api';

interface FavoriteButtonProps {
  article: Article;
  onToggle: (favorited: boolean) => void;
  className?: string;
  children?: ReactNode;
}

export function FavoriteButton({ article, onToggle, className, children }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!article.favorited) {
        await favoriteArticle(article.slug);
      } else {
        await unfavoriteArticle(article.slug);
      }
      onToggle(!article.favorited);
    } finally {
      setIsSubmitting(false);
    }
  };

  const btnClass = [
    'btn btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={btnClass} onClick={handleClick}>
      <i className="ion-heart"></i> {children}
    </button>
  );
}
