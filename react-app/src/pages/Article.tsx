import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Article as ArticleModel, Comment, Profile } from '../models';
import { Articles, Comments } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';

const DEFAULT_IMAGE = 'https://api.realworld.io/images/smiley-cyrus.jpeg';

export function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let stale = false;
    if (!slug) return;
    Articles.get(slug).then((data) => { if (!stale) setArticle(data); }).catch(() => { if (!stale) navigate('/'); });
    Comments.getAll(slug).then((data) => { if (!stale) setComments(data); }).catch(() => { if (!stale) setComments([]); });
    return () => { stale = true; };
  }, [slug, navigate]);

  if (!article) {
    return <div className="article-page">Loading...</div>;
  }

  const canModify = user?.username === article.author.username;

  const handleDelete = async () => {
    await Articles.delete(article.slug);
    navigate('/');
  };

  const handleFavoriteToggle = (updated: ArticleModel) => {
    setArticle(updated);
  };

  const handleFollowToggle = (profile: Profile) => {
    setArticle({ ...article, author: profile });
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug || !commentBody.trim()) return;
    setSubmitting(true);
    setErrors({});
    try {
      const comment = await Comments.add(slug, commentBody);
      setComments(prev => [comment, ...prev]);
      setCommentBody('');
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]> };
      if (apiErr.errors) setErrors(apiErr.errors);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!slug) return;
    await Comments.delete(slug, commentId);
    setComments(prev => prev.filter((c) => c.id !== commentId));
  };

  const renderArticleMeta = () => (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={article.author.image || DEFAULT_IMAGE} alt={article.author.username} />
      </Link>
      <div className="info">
        <Link to={`/profile/${article.author.username}`} className="author">
          {article.author.username}
        </Link>
        <span className="date">{new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      {canModify ? (
        <>
          <Link
            to={`/editor/${article.slug}`}
            className="btn btn-sm btn-outline-secondary"
          >
            <i className="ion-edit"></i> Edit Article
          </Link>
          &nbsp;
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleDelete}
          >
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </>
      ) : (
        <>
          <FollowButton profile={article.author} onToggle={handleFollowToggle} />
          &nbsp;
          <FavoriteButton article={article} onToggle={handleFavoriteToggle} />
        </>
      )}
    </div>
  );

  const htmlBody = DOMPurify.sanitize(marked(article.body, { async: false }) as string);

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          {renderArticleMeta()}
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
            {article.tagList.length > 0 && (
              <ul className="tag-list">
                {article.tagList.map((tag) => (
                  <li key={tag} className="tag-default tag-pill tag-outline">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <hr />

        <div className="article-actions">{renderArticleMeta()}</div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {Object.keys(errors).length > 0 && (
              <ul className="error-messages">
                {Object.entries(errors).map(([key, messages]) =>
                  messages.map((msg) => (
                    <li key={`${key}-${msg}`}>
                      {key} {msg}
                    </li>
                  ))
                )}
              </ul>
            )}

            {isAuthenticated ? (
              <form className="card comment-form" onSubmit={handleAddComment}>
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
                  <img
                    src={user?.image || DEFAULT_IMAGE}
                    className="comment-author-img"
                    alt={user?.username}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    type="submit"
                    disabled={submitting}
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            ) : (
              <p>
                <Link to="/login">Sign in</Link> or{' '}
                <Link to="/register">sign up</Link> to add comments on this
                article.
              </p>
            )}

            {comments.map((comment) => (
              <div className="card" key={comment.id}>
                <div className="card-block">
                  <p className="card-text">{comment.body}</p>
                </div>
                <div className="card-footer">
                  <Link
                    to={`/profile/${comment.author.username}`}
                    className="comment-author"
                  >
                    <img
                      src={comment.author.image || DEFAULT_IMAGE}
                      className="comment-author-img"
                      alt={comment.author.username}
                    />
                  </Link>
                  &nbsp;
                  <Link
                    to={`/profile/${comment.author.username}`}
                    className="comment-author"
                  >
                    {comment.author.username}
                  </Link>
                  <span className="date-posted">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {user?.username === comment.author.username && (
                    <span className="mod-options">
                      <i
                        className="ion-trash-a"
                        onClick={() => handleDeleteComment(comment.id)}
                      ></i>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
