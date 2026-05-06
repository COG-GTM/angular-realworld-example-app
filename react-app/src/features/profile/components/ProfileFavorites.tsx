import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../article/components/ArticleList';
import { ProfileService } from '../services/profile.service';
import type { ArticleListConfig } from '../../article/models/article-list-config.model';

export function ProfileFavorites() {
  const { username } = useParams<{ username: string }>();
  const [favoritesConfig, setFavoritesConfig] = useState<ArticleListConfig | null>(null);

  useEffect(() => {
    if (!username) return;
    ProfileService.get(username).then((profile) => {
      setFavoritesConfig({
        type: 'all',
        filters: { favorited: profile.username },
      });
    });
  }, [username]);

  if (!favoritesConfig) return null;
  return <ArticleList limit={10} config={favoritesConfig} />;
}
