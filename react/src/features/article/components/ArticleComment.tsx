// STUB — owned by the "article" child session.
import type { Comment } from '../../../types';
export interface ArticleCommentProps {
  comment: Comment;
  canModify: boolean;
  onDelete: (commentId: string) => void;
}
export function ArticleComment(_props: ArticleCommentProps) {
  return <div className="card" />;
}
