import { useParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';

export function ProfileFavorites() {
  const { username } = useParams<{ username: string }>();
  if (!username) return null;
  return <ArticleList limit={10} config={{ type: 'all', filters: { favorited: username } }} />;
}
