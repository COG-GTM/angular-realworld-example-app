import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getArticle, getComments, deleteArticle, addComment, deleteComment } from '../api';
import { ArticleMeta, ArticleComment, FavoriteButton, FollowButton, ListErrors } from '../components';
import { defaultImage, renderMarkdown } from '../utils';
import type { Article as ArticleType, Comment, Errors, Profile } from '../types';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [renderedBody, setRenderedBody] = useState('');

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canModify = user?.username === article?.author.username;

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    Promise.all([getArticle(slug), getComments(slug)])
      .then(([a, c]) => {
        if (cancelled) return;
        setArticle(a);
        setComments(c);
      })
      .catch(err => {
        if (cancelled) return;
        setErrors(err.errors || { error: ['Failed to load article'] });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    renderMarkdown(article.body).then(setRenderedBody);
  }, [article]);

  const handleDeleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    await deleteArticle(article.slug);
    navigate('/');
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!article) return;
    setIsSubmitting(true);
    setCommentFormErrors(null);

    try {
      const comment = await addComment(article.slug, commentBody);
      setComments(prev => [comment, ...prev]);
      setCommentBody('');
    } catch (err) {
      setCommentFormErrors(err as Errors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!article) return;
    setDeleteCommentErrors(null);

    try {
      await deleteComment(comment.id, article.slug);
      setComments(prev => prev.filter(c => c !== comment));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const onToggleFavorite = (favorited: boolean) => {
    setArticle(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        favorited,
        favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1,
      };
    });
  };

  const onToggleFollowing = (profile: Profile) => {
    setArticle(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        author: { ...prev.author, following: profile.following },
      };
    });
  };

  const renderActions = () => {
    if (!article) return null;

    if (canModify) {
      return (
        <span>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit"></i> Edit Article
          </Link>
          <button
            className={`btn btn-sm btn-outline-danger${isDeleting ? ' disabled' : ''}`}
            onClick={handleDeleteArticle}
          >
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </span>
      );
    }

    return (
      <span>
        <FollowButton profile={article.author} onToggle={onToggleFollowing} />
        <FavoriteButton article={article} onToggle={onToggleFavorite}>
          {article.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
          <span className="counter">({article.favoritesCount})</span>
        </FavoriteButton>
      </span>
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
              <ArticleMeta article={article}>{renderActions()}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: renderedBody }} />
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
              <ArticleMeta article={article}>{renderActions()}</ArticleMeta>
            </div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {isAuthenticated && (
                  <div>
                    <ListErrors errors={commentFormErrors} />
                    <form className="card comment-form" onSubmit={handleAddComment}>
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
                          <img src={defaultImage(user?.image)} className="comment-author-img" />
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

                {comments.map(comment => (
                  <ArticleComment key={comment.id} comment={comment} onDelete={() => handleDeleteComment(comment)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
