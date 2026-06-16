import { Link } from 'react-router-dom';
import type { Comment } from '../../types';
import { defaultImage } from '../../utils/defaultImage';
import { formatLongDate } from '../../utils/date';

interface Props {
  comment: Comment;
  canModify: boolean;
  onDelete: (comment: Comment) => void;
}

export function ArticleComment({ comment, canModify, onDelete }: Props) {
  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link to={`/profile/${comment.author.username}`} className="comment-author">
          <img src={defaultImage(comment.author.image)} className="comment-author-img" alt={comment.author.username} />
        </Link>
        &nbsp;
        <Link to={`/profile/${comment.author.username}`} className="comment-author">
          {comment.author.username}
        </Link>
        <span className="date-posted">{formatLongDate(comment.createdAt)}</span>
        {canModify && (
          <span className="mod-options">
            <i className="ion-trash-a" onClick={() => onDelete(comment)}></i>
          </span>
        )}
      </div>
    </div>
  );
}
