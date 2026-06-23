import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Article as ArticleModel, Comment, Errors, Profile } from '../types';
import { articlesApi } from '../api/articles';
import { commentsApi } from '../api/comments';
import { useAuth } from '../auth/AuthContext';
import { ArticleMeta } from '../components/ArticleMeta';
import { FollowButton } from '../components/FollowButton';
import { FavoriteButton } from '../components/FavoriteButton';
import { ListErrors } from '../components/ListErrors';
import { ArticleComment } from '../components/ArticleComment';
import { defaultImage, renderMarkdown } from '../utils/format';

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [canModify, setCanModify] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }
    Promise.all([articlesApi.get(slug), commentsApi.getAll(slug)]).then(
      ([loadedArticle, loadedComments]) => {
        setArticle(loadedArticle);
        setComments(loadedComments);
        setCanModify(currentUser?.username === loadedArticle.author.username);
      },
      err => {
        setErrors(err.errors || { error: ['Failed to load article'] });
      },
    );
  }, [slug, currentUser]);

  const onToggleFavorite = (favorited: boolean) => {
    setArticle(prev =>
      prev
        ? { ...prev, favorited, favoritesCount: favorited ? prev.favoritesCount + 1 : prev.favoritesCount - 1 }
        : prev,
    );
  };

  const toggleFollowing = (profile: Profile) => {
    setArticle(prev => (prev ? { ...prev, author: { ...prev.author, following: profile.following } } : prev));
  };

  const deleteArticle = () => {
    if (!article) {
      return;
    }
    setIsDeleting(true);
    articlesApi.delete(article.slug).then(() => navigate('/'));
  };

  const addComment = (event: FormEvent) => {
    event.preventDefault();
    if (!article) {
      return;
    }
    setIsSubmitting(true);
    setCommentFormErrors(null);
    commentsApi.add(article.slug, commentBody).then(
      comment => {
        setComments(prev => [comment, ...prev]);
        setCommentBody('');
        setIsSubmitting(false);
      },
      err => {
        setIsSubmitting(false);
        setCommentFormErrors(err);
      },
    );
  };

  const deleteComment = (comment: Comment) => {
    if (!article) {
      return;
    }
    setDeleteCommentErrors(null);
    commentsApi.delete(comment.id, article.slug).then(
      () => setComments(prev => prev.filter(item => item !== comment)),
      err => setDeleteCommentErrors(err),
    );
  };

  const actions = (a: ArticleModel) =>
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
              <ArticleMeta article={article}>{actions(article)}</ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}></div>

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
              <ArticleMeta article={article}>{actions(article)}</ArticleMeta>
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
                          <img src={defaultImage(currentUser?.image)} className="comment-author-img" alt="" />
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
