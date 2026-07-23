import { Link } from 'react-router-dom';
import { Comment } from '../models/comment';
import { useUser } from '../../../core/auth/user-context';
import { defaultImage } from '../../../shared/default-image';
import { longDate } from '../../../shared/format-date';

export function ArticleComment({ comment, onDelete }: { comment: Comment; onDelete: () => void }) {
  const { currentUser } = useUser();
  const canModify = currentUser?.username === comment.author.username;

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          <img src={defaultImage(comment.author.image)} className="comment-author-img" />
        </Link>
        &nbsp;
        <Link className="comment-author" to={`/profile/${comment.author.username}`}>
          {comment.author.username}
        </Link>
        <span className="date-posted">{longDate(comment.createdAt)}</span>
        {canModify && (
          <span className="mod-options">
            <i className="ion-trash-a" onClick={onDelete}></i>
          </span>
        )}
      </div>
    </div>
  );
}
