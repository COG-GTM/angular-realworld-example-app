import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArticleMeta } from '../components/ArticleMeta';
import { ArticleComment } from '../components/ArticleComment';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { articlesService } from '../services/articles';
import { commentsService } from '../services/comments';
import { useAuth } from '../context/AuthContext';
import { defaultImage, renderMarkdown } from '../utils/format';
import type { ApiError } from '../services/api';
import type { Article as ArticleType, Comment, Errors, Profile } from '../types';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [renderedBody, setRenderedBody] = useState('');

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    Promise.all([articlesService.get(slug, controller.signal), commentsService.getAll(slug, controller.signal)])
      .then(([fetchedArticle, fetchedComments]) => {
        setArticle(fetchedArticle);
        setComments(fetchedComments);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const apiErr = err as ApiError;
        setErrors(apiErr.errors ? apiErr : { errors: { error: ['Failed to load article'] } });
      });

    return () => controller.abort();
  }, [slug]);

  const canModify = !!currentUser && !!article && currentUser.username === article.author.username;

  useEffect(() => {
    let active = true;
    if (article) {
      void renderMarkdown(article.body).then(html => {
        if (active) setRenderedBody(html);
      });
    }
    return () => {
      active = false;
    };
  }, [article]);

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
    await articlesService.delete(article.slug);
    void navigate('/');
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
      setCommentFormErrors(err as ApiError);
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
      setDeleteCommentErrors(err as ApiError);
    }
  };

  const articleActions = (a: ArticleType) =>
    canModify ? (
      <span>
        <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${a.slug}`}>
          <i className="ion-edit"></i> Edit Article
        </Link>{' '}
        <button className={`btn btn-sm btn-outline-danger${isDeleting ? ' disabled' : ''}`} onClick={deleteArticle}>
          <i className="ion-trash-a"></i> Delete Article
        </button>
      </span>
    ) : (
      <span>
        <FollowButton profile={a.author} onToggle={toggleFollowing} />{' '}
        <FavoriteButton article={a} onToggle={onToggleFavorite}>
          {a.favorited ? 'Unfavorite' : 'Favorite'} Article
          <span className="counter">({a.favoritesCount})</span>
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
              <ArticleMeta article={article}>{articleActions(article)}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: renderedBody }}></div>

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
              <ArticleMeta article={article}>{articleActions(article)}</ArticleMeta>
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
                          <img src={defaultImage(currentUser?.image)} className="comment-author-img" />
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
