import { useState } from 'react';
import { Article } from '../models';
import { Articles } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  article: Article;
  compact?: boolean;
  onToggle?: (article: Article) => void;
}

export function FavoriteButton({ article, compact, onToggle }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (article.favorited) {
        const updated = await Articles.unfavorite(article.slug);
        onToggle?.(updated);
      } else {
        const updated = await Articles.favorite(article.slug);
        onToggle?.(updated);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (compact) {
    return (
      <button
        className={`btn btn-sm pull-xs-right ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={handleClick}
        disabled={submitting}
      >
        <i className="ion-heart"></i> {article.favoritesCount}
      </button>
    );
  }

  return (
    <button
      className={`btn btn-sm ${article.favorited ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={handleClick}
      disabled={submitting}
    >
      <i className="ion-heart"></i>&nbsp;
      {article.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
      <span className="counter">({article.favoritesCount})</span>
    </button>
  );
}
