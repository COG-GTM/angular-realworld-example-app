import { Link } from 'react-router-dom';
import type { Comment } from '../models/comment.model';
import { useUser } from '../../../core/auth/services/user.service';
import { defaultImage } from '../../../shared/pipes/default-image';

interface ArticleCommentProps {
  comment: Comment;
  onDelete: () => void;
}

export function ArticleComment({ comment, onDelete }: ArticleCommentProps) {
  const { currentUser } = useUser();
  const canModify = currentUser?.username === comment.author.username;

  const dateStr = new Date(comment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
        <span className="date-posted">{dateStr}</span>
        {canModify && (
          <span className="mod-options">
            <i className="ion-trash-a" onClick={onDelete}></i>
          </span>
        )}
      </div>
    </div>
  );
}
