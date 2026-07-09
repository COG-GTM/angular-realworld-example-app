import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Article } from '../models/article';
import { Comment } from '../models/comment';
import { Profile } from '../../profile/models/profile';
import { Errors } from '../../../core/models/errors';
import { useUser } from '../../../core/auth/user-context';
import { IfAuthenticated } from '../../../core/auth/if-authenticated';
import { ArticleMeta } from '../components/article-meta';
import { ArticleComment } from '../components/article-comment';
import { FavoriteButton } from '../components/favorite-button';
import { FollowButton } from '../../profile/components/follow-button';
import { ListErrors } from '../../../shared/components/list-errors';
import { defaultImage } from '../../../shared/default-image';
import { useMarkdown } from '../../../shared/markdown';
import * as articlesService from '../services/articles.service';
import * as commentsService from '../services/comments.service';

export function ArticlePage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);

  const [commentBody, setCommentBody] = useState('');
  const [commentFormErrors, setCommentFormErrors] = useState<Errors | null>(null);
  const [deleteCommentErrors, setDeleteCommentErrors] = useState<Errors | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const body = useMarkdown(article?.body);
  const canModify = !!article && currentUser?.username === article.author.username;

  useEffect(() => {
    let active = true;
    setErrors(null);
    Promise.all([articlesService.getArticle(slug), commentsService.getAll(slug)])
      .then(([loadedArticle, loadedComments]) => {
        if (!active) {
          return;
        }
        setArticle(loadedArticle);
        setComments(loadedComments);
      })
      .catch((err: Errors) => {
        if (active) {
          setErrors(err?.errors ? err : { errors: { error: ['Failed to load article'] } });
        }
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const onToggleFavorite = (favorited: boolean) => {
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

  const toggleFollowing = (profile: Profile) => {
    setArticle(prev => (prev ? { ...prev, author: { ...prev.author, following: profile.following } } : prev));
  };

  const deleteArticle = async () => {
    if (!article) {
      return;
    }
    setIsDeleting(true);
    try {
      await articlesService.deleteArticle(article.slug);
      navigate('/');
    } catch {
      setIsDeleting(false);
    }
  };

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!article) {
      return;
    }
    setIsSubmitting(true);
    setCommentFormErrors(null);
    try {
      const comment = await commentsService.add(article.slug, commentBody);
      setComments(prev => [comment, ...prev]);
      setCommentBody('');
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setCommentFormErrors(err as Errors);
    }
  };

  const deleteComment = async (comment: Comment) => {
    if (!article) {
      return;
    }
    setDeleteCommentErrors(null);
    try {
      await commentsService.deleteComment(comment.id, article.slug);
      setComments(prev => prev.filter(item => item !== comment));
    } catch (err) {
      setDeleteCommentErrors(err as Errors);
    }
  };

  const ownerActions = (
    <span>
      <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article?.slug}`}>
        <i className="ion-edit"></i> Edit Article
      </Link>{' '}
      <button className={'btn btn-sm btn-outline-danger' + (isDeleting ? ' disabled' : '')} onClick={deleteArticle}>
        <i className="ion-trash-a"></i> Delete Article
      </button>
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

              <ArticleMeta article={article}>
                {canModify ? (
                  ownerActions
                ) : (
                  <span>
                    <FollowButton profile={article.author} onToggle={toggleFollowing} />{' '}
                    <FavoriteButton article={article} onToggle={onToggleFavorite}>
                      {article.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
                      <span className="counter">({article.favoritesCount})</span>
                    </FavoriteButton>
                  </span>
                )}
              </ArticleMeta>
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: body }}></div>

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
              <ArticleMeta article={article}>
                {canModify ? (
                  ownerActions
                ) : (
                  <span>
                    <FollowButton profile={article.author} onToggle={toggleFollowing} />{' '}
                    <FavoriteButton article={article} onToggle={onToggleFavorite}>
                      {article.favorited ? 'Unfavorite' : 'Favorite'} Article{' '}
                      <span className="counter">({article.favoritesCount})</span>
                    </FavoriteButton>
                  </span>
                )}
              </ArticleMeta>
            </div>

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                <IfAuthenticated when={true}>
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
                </IfAuthenticated>

                <IfAuthenticated when={false}>
                  <div>
                    <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this
                    article.
                  </div>
                </IfAuthenticated>

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

export default ArticlePage;
