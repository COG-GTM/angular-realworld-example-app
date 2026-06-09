import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi, commentsApi } from '../api/services';
import { ArticleMeta } from '../components/ArticleMeta';
import { defaultImage } from '../components/assets';
import { FavoriteButton } from '../components/FavoriteButton';
import { FollowButton } from '../components/FollowButton';
import { useUser } from '../context/UserContext';
import type { Article as ArticleModel, Comment } from '../types';

export function Article() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, authState } = useUser();
  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    articlesApi
      .get(slug)
      .then(({ article }) => setArticle(article))
      .catch(() => navigate('/'));
    commentsApi
      .getAll(slug)
      .then(({ comments }) => setComments(comments))
      .catch(() => setComments([]));
  }, [slug, navigate]);

  const renderedBody = useMemo(() => {
    if (!article) return '';
    return DOMPurify.sanitize(marked.parse(article.body, { async: false }));
  }, [article]);

  if (!article) {
    return (
      <div className="article-page">
        <div className="container page">Loading article...</div>
      </div>
    );
  }

  const isAuthor = user?.username === article.author.username;

  const deleteArticle = async () => {
    setIsDeleting(true);
    try {
      await articlesApi.delete(article.slug);
      navigate('/');
    } finally {
      setIsDeleting(false);
    }
  };

  const onFollowToggle = (profile: ArticleModel['author']) => {
    setArticle(prev => (prev ? { ...prev, author: profile } : prev));
  };

  const addComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setIsSubmitting(true);
    try {
      const { comment } = await commentsApi.add(article.slug, commentBody);
      setComments(prev => [comment, ...prev]);
      setCommentBody('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    await commentsApi.delete(article.slug, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const actions = (
    <>
      <FollowButton profile={article.author} onToggle={onFollowToggle} />
      &nbsp;&nbsp;
      <FavoriteButton article={article} onToggle={setArticle}>
        <span>Favorite Article ({article.favoritesCount})</span>
      </FavoriteButton>
      {isAuthor && (
        <span>
          &nbsp;&nbsp;
          <Link to={`/editor/${article.slug}`} className="btn btn-outline-secondary btn-sm">
            <i className="ion-edit"></i> Edit Article
          </Link>
          &nbsp;&nbsp;
          <button className="btn btn-outline-danger btn-sm" disabled={isDeleting} onClick={deleteArticle}>
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </span>
      )}
    </>
  );

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta article={article}>{actions}</ArticleMeta>
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
          <ArticleMeta article={article}>{actions}</ArticleMeta>
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {authState === 'authenticated' && user ? (
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
                    <img src={defaultImage(user.image)} className="comment-author-img" />
                    <button className="btn btn-sm btn-primary" type="submit">
                      Post Comment
                    </button>
                  </div>
                </fieldset>
              </form>
            ) : (
              <p>
                <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this article.
              </p>
            )}

            {comments.map(comment => (
              <div key={comment.id} className="card">
                <div className="card-block">
                  <p className="card-text">{comment.body}</p>
                </div>
                <div className="card-footer">
                  <Link to={`/profile/${comment.author.username}`} className="comment-author">
                    <img src={defaultImage(comment.author.image)} className="comment-author-img" />
                  </Link>
                  &nbsp;
                  <Link to={`/profile/${comment.author.username}`} className="comment-author">
                    {comment.author.username}
                  </Link>
                  <span className="date-posted">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {user?.username === comment.author.username && (
                    <span className="mod-options">
                      <i className="ion-trash-a" onClick={() => deleteComment(comment.id)}></i>
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
