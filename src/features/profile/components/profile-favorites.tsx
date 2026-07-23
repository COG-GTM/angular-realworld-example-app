import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../article/components/article-list';
import { ArticleListConfig } from '../../article/models/article-list-config';

export function ProfileFavorites() {
  const { username = '' } = useParams();

  const config = useMemo<ArticleListConfig>(() => ({ type: 'all', filters: { favorited: username } }), [username]);

  return <ArticleList limit={10} config={config} />;
}

export default ProfileFavorites;
