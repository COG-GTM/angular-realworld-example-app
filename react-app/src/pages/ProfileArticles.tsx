import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleListConfig } from '../types';
import { profilesApi } from '../api/profiles';
import { ArticleList } from '../components/ArticleList';

export default function ProfileArticles() {
  const { username } = useParams<{ username: string }>();
  const [config, setConfig] = useState<ArticleListConfig | null>(null);

  useEffect(() => {
    if (!username) {
      return;
    }
    profilesApi.get(username).then(profile => {
      setConfig({ type: 'all', filters: { author: profile.username } });
    });
  }, [username]);

  if (!config) {
    return null;
  }

  return <ArticleList limit={10} config={config} />;
}
