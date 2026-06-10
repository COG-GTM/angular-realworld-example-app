import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { ArticleListConfig } from '../types';
import { ArticleList } from '../components/ArticleList';

/**
 * Replaces the Angular `ProfileFavoritesComponent` ("Favorited Posts" tab).
 */
export function ProfileFavorites() {
  const { username = '' } = useParams();

  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { favorited: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}
