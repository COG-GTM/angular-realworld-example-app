// STUB — owned by the "home" child session. Cross-boundary contract: keep these props stable.
import type { ReactNode } from 'react';
import type { Article } from '../../../types';
export interface FavoriteButtonProps {
  article: Article;
  onToggle: (favorited: boolean) => void;
  children?: ReactNode;
}
export function FavoriteButton({ children }: FavoriteButtonProps) {
  return <button className="btn btn-sm">{children}</button>;
}
