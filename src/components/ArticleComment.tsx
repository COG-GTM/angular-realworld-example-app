import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import type { Comment } from '../types/comment';
import { defaultImage } from '../utils/image';
import { longDate } from '../utils/date';

/** A single posted comment card. Shows a delete control to the comment's author. */
export function ArticleComment({ comment, onDelete }: { comment: Comment; onDelete: (comment: Comment) => void }) {
  const { currentUser } = useAuth();
  const canModify = currentUser?.username === comment.author.username;

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          <img src={defaultImage(comment.author.image)} className="comment-author-img" alt="" />
        </Link>
        &nbsp;
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          {comment.author.username}
        </Link>
        <span className="date-posted">{longDate(comment.createdAt)}</span>
        {canModify && (
          <span className="mod-options">
            <i className="ion-trash-a" onClick={() => onDelete(comment)}></i>
          </span>
        )}
      </div>
    </div>
  );
}
