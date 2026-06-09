import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import type { ArticleListConfig } from '../types';

export default function ProfileFavorites() {
  const { username } = useParams<{ username: string }>();

  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { favorited: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}
