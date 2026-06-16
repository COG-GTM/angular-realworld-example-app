import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArticleMeta } from '../components/ArticleMeta';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import { ArticleComment } from '../components/ArticleComment';
import { ListErrors } from '../shared/ListErrors';
import { Markdown } from '../shared/Markdown';
import { defaultImage } from '../shared/defaultImage';
import { articlesService } from '../services/articles';
import { commentsService } from '../services/comments';
import { useAuth } from '../auth/AuthContext';
import type { Article as ArticleModel } from '../types/article';
import type { Comment } from '../types/comment';
import type { Profile } from '../types/profile';
import type { Errors } from '../types/errors';

export default function Article() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([articlesService.get(slug), commentsService.getAll(slug)])
      .then(([loadedArticle, loadedComments]) => {
        if (cancelled) return;
        setArticle(loadedArticle);
        setComments(loadedComments);
      })
      .catch((err: Errors) => {
        if (cancelled) return;
        setErrors(err.errors ? err : { errors: { error: ['Failed to load article'] } });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canModify = !!article && !!currentUser && currentUser.username === article.author.username;

  const onToggleFavorite = (favorited: boolean) => {
    setArticle(prev =>
      prev
        ? {
            ...prev,
            favorited,
            favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
          }
        : prev,
    );
  };

  const toggleFollowing = (profile: Profile) => {
    setArticle(prev => (prev ? { ...prev, author: { ...prev.author, following: profile.following } } : prev));
  };

  const deleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await articlesService.delete(article.slug);
      navigate('/');
    } catch {
      setIsDeleting(false);
    }
  };

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!article) return;
    setIsSubmitting(true);
    setCommentFormErrors(null);
    try {
      const comment = await commentsService.add(article.slug, commentBody);
      setComments(prev => [comment, ...prev]);
      setCommentBody('');
    } catch (err) {
      setCommentFormErrors(err as Errors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!article) return;
    setDeleteCommentErrors(null);
    try {
      await commentsService.delete(comment.id, article.slug);
      setComments(prev => prev.filter(item => item.id !== comment.id));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const metaActions = article && (
    <span>
      {canModify ? (
        <>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit"></i> Edit Article
          </Link>{' '}
          <button className={'btn btn-sm btn-outline-danger' + (isDeleting ? ' disabled' : '')} onClick={deleteArticle}>
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </>
      ) : (
        <>
          <FollowButton profile={article.author} onToggle={toggleFollowing} />{' '}
          <FavoriteButton article={article} onToggle={onToggleFavorite}>
            {article.favorited ? 'Unfavorite' : 'Favorite'} Article
            <span className="counter">({article.favoritesCount})</span>
          </FavoriteButton>
        </>
      )}
    </span>
  );

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
              <ArticleMeta article={article}>{metaActions}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <Markdown content={article.body} />

                <ul className="tag-list">
                  {article.tagList.map(tag => (
                    <li key={tag} className="tag-default tag-pill tag-outline">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr />

            <div className="article-actions">
              <ArticleMeta article={article}>{metaActions}</ArticleMeta>
            </div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {isAuthenticated ? (
                  <div>
                    <ListErrors errors={commentFormErrors} />
                    <form className="card comment-form" onSubmit={addComment}>
                      <fieldset disabled={isSubmitting}>
                        <div className="card-block">
                          <textarea
                            className="form-control"
                            placeholder="Write a comment..."
                            rows={3}
                            value={commentBody}
                            onChange={e => setCommentBody(e.target.value)}
                          ></textarea>
                        </div>
                        <div className="card-footer">
                          <img src={defaultImage(currentUser?.image)} className="comment-author-img" alt="" />
                          <button className="btn btn-sm btn-primary" type="submit">
                            Post Comment
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  </div>
                ) : (
                  <div>
                    <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this
                    article.
                  </div>
                )}

                <ListErrors errors={deleteCommentErrors} />

                {comments.map(comment => (
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
