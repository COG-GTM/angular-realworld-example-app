import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { articlesService } from '../services/articles';
import { commentsService } from '../services/comments';
import { renderMarkdown } from '../utils/markdown';
import { defaultImage } from '../utils/defaultImage';
import { ArticleMeta } from '../components/article/ArticleMeta';
import { FavoriteButton } from '../components/article/FavoriteButton';
import { FollowButton } from '../components/profile/FollowButton';
import { ArticleComment } from '../components/article/ArticleComment';
import { ListErrors } from '../components/ListErrors';
import type { Article as ArticleModel, Comment, Errors, Profile } from '../types';

export function Article() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bodyHtml, setBodyHtml] = useState('');
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
        if (!cancelled) setErrors(err?.errors ? err : { errors: { error: ['Failed to load article'] } });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    if (article) {
      void renderMarkdown(article.body).then(html => {
        if (!cancelled) setBodyHtml(html);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [article?.body]);

  const canModify = !!user && !!article && user.username === article.author.username;

  const onToggleFavorite = (favorited: boolean) => {
    setArticle(current =>
      current
        ? {
            ...current,
            favorited,
            favoritesCount: favorited ? current.favoritesCount + 1 : current.favoritesCount - 1,
          }
        : current,
    );
  };

  const toggleFollowing = (profile: Profile) => {
    setArticle(current =>
      current ? { ...current, author: { ...current.author, following: profile.following } } : current,
    );
  };

  const deleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await articlesService.delete(article.slug);
      void navigate('/');
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
      setComments(current => [comment, ...current]);
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
      await commentsService.delete(comment.id, article.slug);
      setComments(current => current.filter(item => item !== comment));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const actions = (current: ArticleModel) =>
    canModify ? (
      <span>
        <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${current.slug}`}>
          <i className="ion-edit"></i> Edit Article
        </Link>{' '}
        <button className={`btn btn-sm btn-outline-danger${isDeleting ? ' disabled' : ''}`} onClick={deleteArticle}>
          <i className="ion-trash-a"></i> Delete Article
        </button>
      </span>
    ) : (
      <span>
        <FollowButton profile={current.author} onToggle={toggleFollowing} />{' '}
        <FavoriteButton article={current} onToggle={onToggleFavorite}>
          {current.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
          <span className="counter">({current.favoritesCount})</span>
        </FavoriteButton>
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
              <ArticleMeta article={article}>{actions(article)}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: bodyHtml }}></div>

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
              <ArticleMeta article={article}>{actions(article)}</ArticleMeta>
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
                            onChange={event => setCommentBody(event.target.value)}
                          ></textarea>
                        </div>
                        <div className="card-footer">
                          <img src={defaultImage(user?.image)} className="comment-author-img" alt={user?.username} />
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
                  <ArticleComment
                    key={comment.id}
                    comment={comment}
                    canModify={!!user && user.username === comment.author.username}
                    onDelete={deleteComment}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
