import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleList } from '../../article/components/ArticleList';
import { ProfileService } from '../services/profile.service';
import type { ArticleListConfig } from '../../article/models/article-list-config.model';

export function ProfileArticles() {
  const { username } = useParams<{ username: string }>();
  const [articlesConfig, setArticlesConfig] = useState<ArticleListConfig | null>(null);

  useEffect(() => {
    if (!username) return;
    ProfileService.get(username).then((profile) => {
      setArticlesConfig({
        type: 'all',
        filters: { author: profile.username },
      });
    });
  }, [username]);

  if (!articlesConfig) return null;
  return <ArticleList limit={10} config={articlesConfig} />;
}
