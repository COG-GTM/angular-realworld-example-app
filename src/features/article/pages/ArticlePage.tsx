import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { articlesService } from '../../../services/articles.service';
import { commentsService } from '../../../services/comments.service';
import { ArticleMeta } from '../components/ArticleMeta';
import { FavoriteButton } from '../components/FavoriteButton';
import { ArticleComment } from '../components/ArticleComment';
import { FollowButton } from '../../profile/components/FollowButton';
import { ListErrors } from '../../../components/ListErrors';
import { defaultImage } from '../../../utils/defaultImage';
import type { Article } from '../../../models/article.model';
import type { Comment } from '../../../models/comment.model';
import type { Errors } from '../../../models/errors.model';
import type { Profile } from '../../../models/profile.model';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renderedBody, setRenderedBody] = useState('');

  const canModify = user?.username === article?.author.username;

  useEffect(() => {
    if (!slug) return;
    Promise.all([articlesService.get(slug), commentsService.getAll(slug)])
      .then(([a, c]) => {
        setArticle(a);
        setComments(c);
      })
      .catch(err => {
        setErrors(err.errors || { errors: { error: 'Failed to load article' } });
      });
  }, [slug]);

  useEffect(() => {
    if (!article?.body) return;
    const html = marked.parse(article.body);
    if (typeof html === 'string') {
      setRenderedBody(DOMPurify.sanitize(html));
    } else {
      html.then(h => setRenderedBody(DOMPurify.sanitize(h)));
    }
  }, [article?.body]);

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

  const toggleFollowing = (profile: Profile) => {
    setArticle(prev => {
      if (!prev) return prev;
      return { ...prev, author: { ...prev.author, following: profile.following } };
    });
  };

  const deleteArticle = async () => {
    if (!article) return;
    setIsDeleting(true);
    await articlesService.delete(article.slug);
    navigate('/');
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;
    setIsSubmitting(true);
    setCommentFormErrors(null);
    try {
      const comment = await commentsService.add(article.slug, commentBody);
      setComments(prev => [comment, ...prev]);
      setCommentBody('');
    } catch (err) {
      setCommentFormErrors(err as Errors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!article) return;
    setDeleteCommentErrors(null);
    try {
      await commentsService.delete(comment.id, article.slug);
      setComments(prev => prev.filter(c => c !== comment));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const articleActions = (a: Article) => (
    <>
      {canModify ? (
        <span>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${a.slug}`}>
            <i className="ion-edit"></i> Edit Article
          </Link>
          <button className={`btn btn-sm btn-outline-danger ${isDeleting ? 'disabled' : ''}`} onClick={deleteArticle}>
            <i className="ion-trash-a"></i> Delete Article
          </button>
        </span>
      ) : (
        <span>
          <FollowButton profile={a.author} onToggle={toggleFollowing} />
          <FavoriteButton article={a} onToggle={onToggleFavorite}>
            {a.favorited ? 'Unfavorite' : 'Favorite'} Article
            <span className="counter">({a.favoritesCount})</span>
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
              <ArticleMeta article={article}>{articleActions(article)}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: renderedBody }} />
                <ul className="tag-list">
                  {article.tagList.map(t => (
                    <li key={t} className="tag-default tag-pill tag-outline">
                      {t}
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
                          />
                        </div>
                        <div className="card-footer">
                          <img src={defaultImage(user?.image)} className="comment-author-img" alt="" />
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
