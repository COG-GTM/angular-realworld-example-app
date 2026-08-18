import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import { profilesApi } from '../services/api';
import type { ArticleListConfig } from '../models';

export default function ProfileFavorites() {
  const { username } = useParams<{ username: string }>();
  const [config, setConfig] = useState<ArticleListConfig | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    profilesApi
      .get(username)
      .then(profile => {
        if (!cancelled) setConfig({ type: 'all', filters: { favorited: profile.username } });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [username]);

  return config ? <ArticleList limit={10} config={config} /> : null;
}
