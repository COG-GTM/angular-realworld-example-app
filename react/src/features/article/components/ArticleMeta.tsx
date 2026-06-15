// STUB — owned by the "home" child session. Cross-boundary contract: keep these props stable.
import type { ReactNode } from 'react';
import type { Article } from '../../../types';
export interface ArticleMetaProps {
  article: Article;
  children?: ReactNode;
}
export function ArticleMeta({ children }: ArticleMetaProps) {
  return <div className="article-meta">{children}</div>;
}
