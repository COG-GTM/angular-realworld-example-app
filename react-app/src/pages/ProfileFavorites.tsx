import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import type { ArticleListConfig } from '../types';

export function ProfileFavorites() {
  const { username } = useParams();

  const config = useMemo<ArticleListConfig | null>(
    () => (username ? { type: 'all', filters: { favorited: username } } : null),
    [username],
  );

  if (!config) {
    return null;
  }

  return <ArticleList limit={10} config={config} />;
}
