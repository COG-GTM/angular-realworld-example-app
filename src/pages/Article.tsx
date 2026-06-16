import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as articlesApi from '../api/articles';
import * as commentsApi from '../api/comments';
import type { Article as ArticleType } from '../types/article';
import type { Comment } from '../types/comment';
import type { Profile } from '../types/profile';
import type { Errors } from '../types/errors';
import { ArticleMeta } from '../components/ArticleMeta';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import { ArticleComment } from '../components/ArticleComment';
import { ListErrors } from '../components/ListErrors';
import { renderMarkdown } from '../utils/markdown';
import { defaultImage } from '../utils/image';
import { cx } from '../utils/cx';

export function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    // Load the article and its comments independently so a slow/failed comments
    // request never blocks the article body from rendering.
    articlesApi
      .get(slug)
      .then(loadedArticle => {
        if (!cancelled) setArticle(loadedArticle);
      })
      .catch((err: Errors) => {
        if (!cancelled) setErrors(err?.errors ? err : { errors: { error: ['Failed to load article'] } });
      });

    commentsApi
      .getAll(slug)
      .then(loadedComments => {
        if (!cancelled) setComments(loadedComments);
      })
      .catch(() => {
        // Comments are non-critical for viewing the article; ignore load errors.
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canModify = useMemo(
    () => !!article && currentUser?.username === article.author.username,
    [article, currentUser],
  );

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
      await articlesApi.del(article.slug);
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
      const comment = await commentsApi.add(article.slug, commentBody);
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
      await commentsApi.del(article.slug, comment.id);
      setComments(prev => prev.filter(item => item.id !== comment.id));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const actions = article && (
    <>
      {canModify ? (
        <span>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit"></i> Edit Article
          </Link>{' '}
          <button className={cx('btn btn-sm btn-outline-danger', { disabled: isDeleting })} onClick={deleteArticle}>
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </span>
      ) : (
        <span>
          <FollowButton profile={article.author} onToggle={toggleFollowing} />{' '}
          <FavoriteButton article={article} onToggle={onToggleFavorite}>
            {article.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
            <span className="counter">({article.favoritesCount})</span>
          </FavoriteButton>
        </span>
      )}
    </>
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
              <ArticleMeta article={article}>{actions}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
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
              <ArticleMeta article={article}>{actions}</ArticleMeta>
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
                  <ArticleComment key={comment.id} comment={comment} onDelete={deleteComment} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
