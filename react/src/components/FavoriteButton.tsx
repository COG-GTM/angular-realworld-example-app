import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesApi } from '../api/services';
import { useUser } from '../context/UserContext';
import type { Article } from '../types';

interface Props {
  article: Article;
  onToggle: (article: Article) => void;
  className?: string;
  children?: ReactNode;
}

export function FavoriteButton({ article, onToggle, className = '', children }: Props) {
  const { authState } = useUser();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggle = async () => {
    if (authState !== 'authenticated') {
      navigate('/register');
      return;
    }
    setIsSubmitting(true);
    try {
      const { article: updated } = article.favorited
        ? await articlesApi.unfavorite(article.slug)
        : await articlesApi.favorite(article.slug);
      onToggle(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      className={`btn btn-sm ${article.favorited ? 'btn-primary' : 'btn-outline-primary'} ${className}`}
      disabled={isSubmitting}
      onClick={toggle}
    >
      <i className="ion-heart"></i> {children}
    </button>
  );
}
