import React, { useState, useCallback } from 'react';

interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
}

interface FavoriteButtonProps {
  article: Article;
  children?: React.ReactNode;
  /** Called after a successful toggle. Receives the new `favorited` state. */
  onToggle?: (favorited: boolean) => void;
  /** Whether the current user is authenticated. */
  isAuthenticated?: boolean;
  /** Callback to navigate when user is not authenticated. */
  onNavigateToRegister?: () => void;
  /**
   * Service function to favorite an article by slug.
   * TODO: Wire up to actual ArticlesService when integrating.
   */
  onFavorite?: (slug: string) => Promise<void>;
  /**
   * Service function to unfavorite an article by slug.
   * TODO: Wire up to actual ArticlesService when integrating.
   */
  onUnfavorite?: (slug: string) => Promise<void>;
}

/**
 * React equivalent of the Angular `FavoriteButtonComponent`.
 *
 * Renders a favorite/unfavorite button for an article.
 * Uses `<ng-content>` equivalent via `props.children`.
 * Mirrors the Angular signal-based `isSubmitting` state with `useState`.
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  article,
  children,
  onToggle,
  isAuthenticated = false,
  onNavigateToRegister,
  onFavorite,
  onUnfavorite,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFavorite = useCallback(async () => {
    setIsSubmitting(true);

    if (!isAuthenticated) {
      onNavigateToRegister?.();
      setIsSubmitting(false);
      return;
    }

    try {
      if (!article.favorited) {
        if (onFavorite) {
          await onFavorite(article.slug);
        } else {
          return;
        }
      } else {
        if (onUnfavorite) {
          await onUnfavorite(article.slug);
        } else {
          return;
        }
      }
      onToggle?.(!article.favorited);
    } catch {
      // Error handling — matches Angular's error callback (no-op)
    } finally {
      setIsSubmitting(false);
    }
  }, [article, isAuthenticated, onFavorite, onUnfavorite, onToggle, onNavigateToRegister]);

  const buttonClass = [
    'btn',
    'btn-sm',
    isSubmitting ? 'disabled' : '',
    article.favorited ? 'btn-primary' : 'btn-outline-primary',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={buttonClass} onClick={toggleFavorite} disabled={isSubmitting}>
      <i className="ion-heart"></i> {children}
    </button>
  );
};
