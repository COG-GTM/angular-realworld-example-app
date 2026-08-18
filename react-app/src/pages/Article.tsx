import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArticleComment } from '../components/ArticleComment';
import { ArticleMeta } from '../components/ArticleMeta';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import { ListErrors } from '../components/ListErrors';
import { useAuth } from '../context/AuthContext';
import { articlesApi, commentsApi } from '../services/api';
import { defaultImage } from '../utils/format';
import { renderMarkdown } from '../utils/markdown';
import type { ApiError } from '../services/api';
import type { Article as ArticleModel, Comment, Errors, Profile } from '../models';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
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
    if (!slug) return;
    let cancelled = false;

    Promise.all([articlesApi.get(slug), commentsApi.getAll(slug)])
      .then(([loadedArticle, loadedComments]) => {
        if (cancelled) return;
        setArticle(loadedArticle);
        setComments(loadedComments);
      })
      .catch((error: ApiError) => {
        // Mirrors the Angular component, which stores the inner error map in this signal.
        if (!cancelled) {
          setErrors((error.errors as unknown as Errors | undefined) ?? { errors: { error: 'Failed to load article' } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canModify = currentUser?.username === article?.author.username;
  const body = useMemo(() => (article ? renderMarkdown(article.body) : ''), [article]);

  const onToggleFavorite = (favorited: boolean) =>
    setArticle(current =>
      current
        ? {
            ...current,
            favorited,
            favoritesCount: favorited ? current.favoritesCount + 1 : current.favoritesCount - 1,
          }
        : current,
    );

  const toggleFollowing = (profile: Profile) =>
    setArticle(current =>
      current ? { ...current, author: { ...current.author, following: profile.following } } : current,
    );

  const deleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    await articlesApi.delete(article.slug);
    navigate('/');
  };

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!article) return;

    setIsSubmitting(true);
    setCommentFormErrors(null);

    try {
      const comment = await commentsApi.add(article.slug, commentBody);
      setComments(current => [comment, ...current]);
      setCommentBody('');
      setIsSubmitting(false);
    } catch (error) {
      setIsSubmitting(false);
      setCommentFormErrors(error as ApiError);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!article) return;
    setDeleteCommentErrors(null);

    try {
      await commentsApi.delete(comment.id, article.slug);
      setComments(current => current.filter(item => item !== comment));
    } catch (error) {
      setDeleteCommentErrors(error as ApiError);
    }
  };

  const articleActions = article && (
    <>
      {canModify ? (
        <span>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit"></i> Edit Article
          </Link>

          <button
            className={isDeleting ? 'btn btn-sm btn-outline-danger disabled' : 'btn btn-sm btn-outline-danger'}
            onClick={() => void deleteArticle()}
          >
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </span>
      ) : (
        <span>
          <FollowButton profile={article.author} onToggle={toggleFollowing} />

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

              <ArticleMeta article={article}>{articleActions}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: body }}></div>

                <ul className="tag-list">
                  {article.tagList.map(tag => (
                    <li className="tag-default tag-pill tag-outline" key={tag}>
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <hr />

            <div className="article-actions">
              <ArticleMeta article={article}>{articleActions}</ArticleMeta>
            </div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {isAuthenticated ? (
                  <div>
                    <ListErrors errors={commentFormErrors} />
                    <form className="card comment-form" onSubmit={event => void addComment(event)}>
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
                  <ArticleComment comment={comment} onDelete={() => void deleteComment(comment)} key={comment.id} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
