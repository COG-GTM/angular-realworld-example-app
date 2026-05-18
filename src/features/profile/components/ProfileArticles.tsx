import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../article/components/ArticleList';
import type { ArticleListConfig } from '../../../models/article.model';

export function ProfileArticles() {
  const { username } = useParams<{ username: string }>();

  const config = useMemo<ArticleListConfig | null>(() => {
    if (!username) return null;
    return {
      type: 'all',
      filters: { author: username },
    };
  }, [username]);

  if (!config) return null;

  return <ArticleList limit={10} config={config} />;
}
