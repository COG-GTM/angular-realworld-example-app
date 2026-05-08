import { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import { ArticleListConfig } from '../models';

export function ProfileFavorites() {
  const { username } = useOutletContext<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [config] = useState<ArticleListConfig>({
    type: 'all',
    filters: { favorited: username, limit: 5 },
  });

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
  };

  return (
    <ArticleList
      config={{ ...config, filters: { ...config.filters, favorited: username } }}
      currentPage={currentPage}
      onPageChange={handlePageChange}
    />
  );
}
