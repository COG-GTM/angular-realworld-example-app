import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Article } from "../models/article.model";
import { Comment } from "../models/comment.model";
import { useAuth } from "../context/AuthContext";
import { ArticlesService } from "../services/articles.service";
import { CommentsService } from "../services/comments.service";
import { FavoriteButton } from "../components/shared/FavoriteButton";
import { FollowButton } from "../components/shared/FollowButton";

function defaultImage(image: string | null | undefined): string {
  return image || "/realworld/assets/media/default-avatar.svg";
}

function ArticleMeta({
  article,
  onDelete,
  onArticleUpdate,
}: {
  article: Article;
  onDelete: () => void;
  onArticleUpdate: (article: Article) => void;
}) {
  const { currentUser, authState } = useAuth();
  const isAuthor = currentUser?.username === article.author.username;

  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img
          src={defaultImage(article.author.image)}
          alt={article.author.username}
        />
      </Link>
      <div className="info">
        <Link to={`/profile/${article.author.username}`} className="author">
          {article.author.username}
        </Link>
        <span className="date">
          {new Date(article.createdAt).toDateString()}
        </span>
      </div>

      {isAuthor ? (
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
            onClick={onDelete}
          >
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </>
      ) : (
        authState !== "loading" && (
          <>
            <FollowButton
              profile={article.author}
              onToggle={(profile) =>
                onArticleUpdate({ ...article, author: profile })
              }
            />
            &nbsp;
            <FavoriteButton article={article} onToggle={onArticleUpdate}>
              &nbsp;
              {article.favorited ? "Unfavorite" : "Favorite"} Article{" "}
              <span className="counter">({article.favoritesCount})</span>
            </FavoriteButton>
          </>
        )
      )}
    </div>
  );
}

function ArticleComment({
  comment,
  slug,
  onDelete,
}: {
  comment: Comment;
  slug: string;
  onDelete: (id: string) => void;
}) {
  const { currentUser } = useAuth();
  const isAuthor = currentUser?.username === comment.author.username;

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <Link
          to={`/profile/${comment.author.username}`}
          className="comment-author"
        >
          <img
            src={defaultImage(comment.author.image)}
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
          {new Date(comment.createdAt).toDateString()}
        </span>
        {isAuthor && (
          <span className="mod-options">
            <i
              className="ion-trash-a"
              onClick={() => onDelete(comment.id)}
              style={{ cursor: "pointer" }}
            ></i>
          </span>
        )}
      </div>
    </div>
  );
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, authState } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [commentErrors, setCommentErrors] = useState<Record<string, string[]> | null>(null);

  useEffect(() => {
    if (!slug) return;
    ArticlesService.get(slug)
      .then(setArticle)
      .catch(() => setLoadError(true));
    CommentsService.getAll(slug).then(setComments).catch(() => {});
  }, [slug]);

  const handleDelete = async () => {
    if (!slug) return;
    await ArticlesService.delete(slug);
    navigate("/");
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug || !commentBody.trim()) return;
    setSubmitting(true);
    setCommentErrors(null);
    try {
      const comment = await CommentsService.add(slug, commentBody);
      setComments((prev) => [comment, ...prev]);
      setCommentBody("");
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]> };
      setCommentErrors(error.errors || { comment: ["Failed to post comment"] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!slug) return;
    try {
      await CommentsService.delete(commentId, slug);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentErrors(null);
    } catch (err: unknown) {
      const error = err as { errors?: Record<string, string[]> };
      setCommentErrors(error.errors || { comment: ["Failed to delete comment"] });
    }
  };

  if (loadError) {
    return (
      <div className="article-page">
        <div className="container page">
          <div className="row article-content">
            <div className="col-md-12">
              <p>Could not load article.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return <div className="article-page">Loading...</div>;
  }

  const markup = { __html: DOMPurify.sanitize(marked.parse(article.body) as string) };

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta
            article={article}
            onDelete={handleDelete}
            onArticleUpdate={setArticle}
          />
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <div dangerouslySetInnerHTML={markup} />
          </div>
        </div>

        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li key={tag} className="tag-default tag-pill tag-outline">
                {tag}
              </li>
            ))}
          </ul>
        )}

        <hr />

        <div className="article-actions">
          <ArticleMeta
            article={article}
            onDelete={handleDelete}
            onArticleUpdate={setArticle}
          />
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {authState === "authenticated" && currentUser ? (
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
                    src={defaultImage(currentUser.image)}
                    className="comment-author-img"
                    alt={currentUser.username}
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
                <Link to="/login">Sign in</Link> or{" "}
                <Link to="/register">sign up</Link> to add comments on this
                article.
              </p>
            )}

            {commentErrors && (
              <ul className="error-messages">
                {Object.keys(commentErrors).map((key) => (
                  <li key={key}>{key} {commentErrors[key].join(", ")}</li>
                ))}
              </ul>
            )}

            {comments.map((comment) => (
              <ArticleComment
                key={comment.id}
                comment={comment}
                slug={slug!}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
