import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { ArticleListConfig } from '../types';
import { ArticleList } from '../components/ArticleList';

/**
 * Replaces the Angular `ProfileArticlesComponent` ("My Posts" tab). Lists
 * articles authored by the profile user.
 */
export function ProfileArticles() {
  const { username = '' } = useParams();

  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { author: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}
