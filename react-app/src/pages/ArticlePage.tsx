import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Article } from '../models/article';
import { Comment } from '../models/comment';
import { getArticle, deleteArticle, favoriteArticle, unfavoriteArticle } from '../services/articles.service';
import { getComments, addComment, deleteComment } from '../services/comments.service';
import { useAuth } from '../context/AuthContext';
import FollowButton from '../components/FollowButton';
import FavoriteButton from '../components/FavoriteButton';
import { Profile } from '../models/profile';

function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      Promise.all([getArticle(slug), getComments(slug)])
        .then(([a, c]) => { setArticle(a); setComments(c); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [slug]);

  const handleDelete = async () => {
    if (slug) {
      await deleteArticle(slug);
      navigate('/');
    }
  };

  const handleFavoriteToggle = async (a: Article) => {
    const updated = a.favorited
      ? { ...a, favorited: false, favoritesCount: a.favoritesCount - 1 }
      : await favoriteArticle(a.slug);
    if (a.favorited) await unfavoriteArticle(a.slug);
    setArticle(updated);
  };

  const handleFollowToggle = (profile: Profile) => {
    if (article) {
      setArticle({ ...article, author: profile });
    }
  };

  const handleAddComment = async () => {
    if (slug && commentBody.trim()) {
      const comment = await addComment(slug, commentBody);
      setComments([comment, ...comments]);
      setCommentBody('');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (slug) {
      await deleteComment(slug, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  if (loading) return <div className="article-page"><div className="container">Loading...</div></div>;
  if (!article) return <div className="article-page"><div className="container">Article not found</div></div>;

  const isAuthor = user?.username === article.author.username;
  const defaultImage = 'https://api.realworld.io/images/smiley-cyrus.jpeg';

  const ArticleMeta = () => (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={article.author.image || defaultImage} alt={article.author.username} />
      </Link>
      <div className="info">
        <Link to={`/profile/${article.author.username}`} className="author">
          {article.author.username}
        </Link>
        <span className="date">{new Date(article.createdAt).toDateString()}</span>
      </div>
      {isAuthor ? (
        <>
          <Link to={`/editor/${article.slug}`} className="btn btn-outline-secondary btn-sm">
            <i className="ion-edit" /> Edit Article
          </Link>
          &nbsp;
          <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
            <i className="ion-trash-a" /> Delete Article
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

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta />
        </div>
      </div>
      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(article.body) as string) }} />
            {article.tagList.length > 0 && (
              <ul className="tag-list">
                {article.tagList.map((tag) => (
                  <li key={tag} className="tag-default tag-pill tag-outline">{tag}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <hr />
        <div className="article-actions">
          <ArticleMeta />
        </div>
        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {isAuthenticated ? (
              <form className="card comment-form" onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}>
                <div className="card-block">
                  <textarea
                    className="form-control"
                    placeholder="Write a comment..."
                    rows={3}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                  />
                </div>
                <div className="card-footer">
                  <img src={user?.image || defaultImage} className="comment-author-img" alt={user?.username} />
                  <button className="btn btn-sm btn-primary" type="submit">Post Comment</button>
                </div>
              </form>
            ) : (
              <p>
                <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this article.
              </p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="card">
                <div className="card-block">
                  <p className="card-text">{comment.body}</p>
                </div>
                <div className="card-footer">
                  <Link to={`/profile/${comment.author.username}`} className="comment-author">
                    <img src={comment.author.image || defaultImage} className="comment-author-img" alt={comment.author.username} />
                  </Link>
                  &nbsp;
                  <Link to={`/profile/${comment.author.username}`} className="comment-author">
                    {comment.author.username}
                  </Link>
                  <span className="date-posted">{new Date(comment.createdAt).toDateString()}</span>
                  {user?.username === comment.author.username && (
                    <span className="mod-options">
                      <i className="ion-trash-a" onClick={() => handleDeleteComment(comment.id)} />
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

export default ArticlePage;
