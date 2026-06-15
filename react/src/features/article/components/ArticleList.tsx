// STUB — owned by the "home" child session. Cross-boundary contract: keep these props stable.
import type { ArticleListConfig } from '../../../types';
export interface ArticleListProps {
  config: ArticleListConfig;
  limit: number;
  currentPage?: number;
  isFollowingFeed?: boolean;
  onPageChange?: (page: number) => void;
}
export function ArticleList(_props: ArticleListProps) {
  return null;
}
