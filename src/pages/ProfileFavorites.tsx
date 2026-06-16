import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import type { ArticleListConfig } from '../types/article-list-config';

export default function ProfileFavorites() {
  const { username = '' } = useParams();
  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { favorited: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}
