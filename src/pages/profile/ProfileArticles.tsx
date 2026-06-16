import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../components/article/ArticleList';
import type { ArticleListConfig } from '../../types';

export function ProfileArticles() {
  const { username = '' } = useParams();
  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { author: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}
