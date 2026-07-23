import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../article/components/article-list';
import { ArticleListConfig } from '../../article/models/article-list-config';

export function ProfileArticles() {
  const { username = '' } = useParams();

  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { author: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}

export default ProfileArticles;
