import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi, commentsApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ArticleMeta } from '../components/ArticleMeta';
import { ListErrors } from '../components/ListErrors';
import { ArticleComment } from '../components/ArticleComment';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import type { ApiError } from '../api/client';
import type { Article as ArticleType, Comment, Profile } from '../types';
import { defaultImage } from '../utils/format';
import { renderMarkdown } from '../utils/markdown';

export function Article() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [canModify, setCanModify] = useState(false);
  const [errors, setErrors] = useState<ApiError | null>(null);

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<ApiError | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<ApiError | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([articlesApi.get(slug), commentsApi.getAll(slug)])
      .then(([loadedArticle, loadedComments]) => {
        setArticle(loadedArticle);
        setComments(loadedComments);
        setCanModify(currentUser?.username === loadedArticle.author.username);
      })
      .catch((err: ApiError) => {
        setErrors(err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    setCanModify(!!article && currentUser?.username === article.author.username);
  }, [currentUser, article]);

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

  const deleteArticle = () => {
    if (!article) return;
    setIsDeleting(true);
    articlesApi.delete(article.slug).then(() => {
      void navigate('/');
    });
  };

  const addComment = (event: FormEvent) => {
    event.preventDefault();
    if (!article) return;
    setIsSubmitting(true);
    setCommentFormErrors(null);

    commentsApi
      .add(article.slug, commentBody)
      .then(comment => {
        setComments(current => [comment, ...current]);
        setCommentBody('');
        setIsSubmitting(false);
      })
      .catch((err: ApiError) => {
        setIsSubmitting(false);
        setCommentFormErrors(err);
      });
  };

  const deleteComment = (comment: Comment) => {
    if (!article) return;
    setDeleteCommentErrors(null);
    commentsApi
      .delete(comment.id, article.slug)
      .then(() => {
        setComments(current => current.filter(item => item !== comment));
      })
      .catch((err: ApiError) => {
        setDeleteCommentErrors(err);
      });
  };

  const articleActions = (a: ArticleType) =>
    canModify ? (
      <span>
        <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${a.slug}`}>
          <i className="ion-edit"></i> Edit Article
        </Link>{' '}
        <button
          className={isDeleting ? 'btn btn-sm btn-outline-danger disabled' : 'btn btn-sm btn-outline-danger'}
          onClick={deleteArticle}
        >
          <i className="ion-trash-a"></i> Delete Article
        </button>
      </span>
    ) : (
      <span>
        <FollowButton profile={a.author} onToggle={toggleFollowing} />{' '}
        <FavoriteButton article={a} onToggle={onToggleFavorite}>
          {a.favorited ? 'Unfavorite' : 'Favorite'} Article <span className="counter">({a.favoritesCount})</span>
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
