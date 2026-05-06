import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Article } from '../../models/article.model';
import type { Comment } from '../../models/comment.model';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { useUser } from '../../../../core/auth/services/user.service';
import { ArticleMeta } from '../../components/ArticleMeta';
import { FavoriteButton } from '../../components/FavoriteButton';
import { FollowButton } from '../../../profile/components/FollowButton';
import { ArticleComment } from '../../components/ArticleComment';
import { ListErrors } from '../../../../shared/components/ListErrors';
import type { Errors } from '../../../../core/models/errors.model';
import type { Profile } from '../../../profile/models/profile.model';
import { defaultImage } from '../../../../shared/pipes/default-image';
import { renderMarkdown } from '../../../../shared/pipes/markdown';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser, isAuthenticated } = useUser();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [canModify, setCanModify] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bodyHtml, setBodyHtml] = useState('');

  useEffect(() => {
    if (!slug) return;

    Promise.all([ArticlesService.get(slug), CommentsService.getAll(slug)])
      .then(([articleData, commentsData]) => {
        setArticle(articleData);
        setComments(commentsData);
        setCanModify(currentUser?.username === articleData.author.username);
        renderMarkdown(articleData.body).then(setBodyHtml);
      })
      .catch((err) => {
        setErrors(err.errors ? err : { errors: { error: 'Failed to load article' } });
      });
  }, [slug, currentUser]);

  const onToggleFavorite = (favorited: boolean) => {
    setArticle((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        favorited,
        favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
      };
    });
  };

  const toggleFollowing = (profile: Profile) => {
    setArticle((prev) => {
      if (!prev) return prev;
      return { ...prev, author: { ...prev.author, following: profile.following } };
    });
  };

  const deleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    await ArticlesService.delete(article.slug);
    navigate('/');
  };

  const addComment = async () => {
    if (!article) return;
    setIsSubmitting(true);
    setCommentFormErrors(null);

    try {
      const comment = await CommentsService.add(article.slug, commentBody);
      setComments((prev) => [comment, ...prev]);
      setCommentBody('');
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setCommentFormErrors(err as Errors);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!article) return;
    setDeleteCommentErrors(null);

    try {
      await CommentsService.delete(comment.id, article.slug);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const renderArticleActions = () => {
    if (!article) return null;
    return (
      <ArticleMeta article={article}>
        {canModify ? (
          <span>
            <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
              <i className="ion-edit"></i> Edit Article
            </Link>

            <button
              className={`btn btn-sm btn-outline-danger${isDeleting ? ' disabled' : ''}`}
              onClick={deleteArticle}
            >
              <i className="ion-trash-a"></i> Delete Article
            </button>
          </span>
        ) : (
          <span>
            <FollowButton profile={article.author} onToggle={toggleFollowing} />

            <FavoriteButton article={article} onToggle={onToggleFavorite}>
              {article.favorited ? 'Unfavorite' : 'Favorite'} Article
              <span className="counter">({article.favoritesCount})</span>
            </FavoriteButton>
          </span>
        )}
      </ArticleMeta>
    );
  };

  return (
    <div className="article-page">
      {errors && (
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <ListErrors errors={errors} />
            </div>
          </div>
        </div>
      )}
      {article && (
        <>
          <div className="banner">
            <div className="container">
              <h1>{article.title}</h1>
              {renderArticleActions()}
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />

                <ul className="tag-list">
                  {article.tagList.map((tag) => (
                    <li key={tag} className="tag-default tag-pill tag-outline">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr />

            <div className="article-actions">{renderArticleActions()}</div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {isAuthenticated && (
                  <div>
                    <ListErrors errors={commentFormErrors} />
                    <form
                      className="card comment-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addComment();
                      }}
                    >
                      <fieldset disabled={isSubmitting}>
                        <div className="card-block">
                          <textarea
                            className="form-control"
                            placeholder="Write a comment..."
                            rows={3}
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                          ></textarea>
                        </div>
                        <div className="card-footer">
                          <img src={defaultImage(currentUser?.image)} className="comment-author-img" />
                          <button className="btn btn-sm btn-primary" type="submit">
                            Post Comment
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  </div>
                )}

                {!isAuthenticated && (
                  <div>
                    <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this
                    article.
                  </div>
                )}

                <ListErrors errors={deleteCommentErrors} />

                {comments.map((comment) => (
                  <ArticleComment key={comment.id} comment={comment} onDelete={() => deleteComment(comment)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
