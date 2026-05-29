import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getArticle, deleteArticle } from '../../services/articles.service';
import { getComments, addComment, deleteComment } from '../../services/comments.service';
import { renderMarkdown } from '../../utils/markdown';
import { defaultImage } from '../../utils/default-image';
import { ArticleMeta } from '../../components/ArticleMeta/ArticleMeta';
import { FavoriteButton } from '../../components/FavoriteButton/FavoriteButton';
import { FollowButton } from '../../components/FollowButton/FollowButton';
import { ArticleComment } from '../../components/ArticleComment/ArticleComment';
import { ListErrors } from '../../components/ListErrors/ListErrors';
import type { Article as ArticleType, Comment, Errors, Profile } from '../../types';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [article, setArticle] = useState<ArticleType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [bodyHtml, setBodyHtml] = useState('');

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canModify = user?.username === article?.author.username;

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    Promise.all([
      getArticle(slug, controller.signal),
      getComments(slug, controller.signal),
    ])
      .then(([a, c]) => {
        setArticle(a);
        setComments(c);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setErrors(err.errors ? err : { errors: { error: 'Failed to load article' } });
        }
      });

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (article?.body) {
      renderMarkdown(article.body).then(setBodyHtml);
    }
  }, [article?.body]);

  const handleToggleFavorite = (favorited: boolean) => {
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

  const handleToggleFollowing = (profile: Profile) => {
    setArticle(prev =>
      prev ? { ...prev, author: { ...prev.author, following: profile.following } } : prev,
    );
  };

  const handleDeleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    try {
      await deleteArticle(article.slug);
      navigate('/');
    } catch (err) {
      setErrors(err as Errors);
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!article || !commentBody.trim()) return;

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
      setComments(prev => prev.filter(c => c.id !== comment.id));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const articleActions = article && (
    <ArticleMeta article={article}>
      {canModify ? (
        <span>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit"></i> Edit Article
          </Link>
          <button
            className={`btn btn-sm btn-outline-danger${isDeleting ? ' disabled' : ''}`}
            onClick={handleDeleteArticle}
            disabled={isDeleting}
          >
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </span>
      ) : (
        <span>
          <FollowButton profile={article.author} onToggle={handleToggleFollowing} />
          <FavoriteButton article={article} onToggle={handleToggleFavorite}>
            {article.favorited ? 'Unfavorite' : 'Favorite'} Article
            <span className="counter">({article.favoritesCount})</span>
          </FavoriteButton>
        </span>
      )}
    </ArticleMeta>
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
              {articleActions}
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
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

            <div className="article-actions">{articleActions}</div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {user ? (
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
                          />
                        </div>
                        <div className="card-footer">
                          <img
                            src={defaultImage(user.image)}
                            className="comment-author-img"
                            alt={user.username}
                          />
                          <button className="btn btn-sm btn-primary" type="submit">
                            Post Comment
                          </button>
                        </div>
                      </fieldset>
                    </form>
                  </div>
                ) : (
                  <div>
                    <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add
                    comments on this article.
                  </div>
                )}

                <ListErrors errors={deleteCommentErrors} />

                {comments.map(comment => (
                  <ArticleComment
                    key={comment.id}
                    comment={comment}
                    onDelete={() => handleDeleteComment(comment)}
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
