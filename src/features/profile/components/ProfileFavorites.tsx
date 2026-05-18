import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../article/components/ArticleList';
import type { ArticleListConfig } from '../../../models/article.model';

export function ProfileFavorites() {
  const { username } = useParams<{ username: string }>();

  const config = useMemo<ArticleListConfig | null>(() => {
    if (!username) return null;
    return {
      type: 'all',
      filters: { favorited: username },
    };
  }, [username]);

  if (!config) return null;

  return <ArticleList limit={10} config={config} />;
}
