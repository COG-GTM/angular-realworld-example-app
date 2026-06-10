import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Errors } from '../types';
import { useAuth } from '../hooks/useAuth';
import { createArticle, getArticle, updateArticle } from '../api/articles';
import { ListErrors } from '../components/ListErrors';

/**
 * Replaces the Angular `EditorComponent`. Handles both create (`/editor`) and
 * edit (`/editor/:slug`).
 */
export function EditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagField, setTagField] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) {
      return;
    }
    const controller = new AbortController();
    getArticle(slug, controller.signal)
      .then(article => {
        if (currentUser && currentUser.username === article.author.username) {
          setTitle(article.title);
          setDescription(article.description);
          setBody(article.body);
          setTagList(article.tagList);
        } else {
          void navigate('/');
        }
      })
      .catch(err => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          void navigate('/');
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const addTag = (): string[] => {
    const tag = tagField.trim();
    let next = tagList;
    if (tag !== '' && tagList.indexOf(tag) < 0) {
      next = [...tagList, tag];
      setTagList(next);
    }
    setTagField('');
    return next;
  };

  const removeTag = (tagName: string) => {
    setTagList(tags => tags.filter(tag => tag !== tagName));
  };

  const onTagKeyUp = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addTag();
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    // Commit any single typed-but-not-yet-added tag.
    const tags = addTag();

    const articleData = { title, description, body, tagList: tags };

    try {
      const article = slug ? await updateArticle({ ...articleData, slug }) : await createArticle(articleData);
      void navigate(`/article/${article.slug}`);
    } catch (err) {
      setErrors(err as Errors);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ListErrors errors={errors} />

            <form>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    name="title"
                    type="text"
                    placeholder="Article Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    name="description"
                    type="text"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    name="body"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  ></textarea>
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagField}
                    onChange={e => setTagField(e.target.value)}
                    onKeyUp={onTagKeyUp}
                  />
                  <div className="tag-list">
                    {tagList.map(tag => (
                      <span key={tag} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => removeTag(tag)}></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>

                <button className="btn btn-lg pull-xs-right btn-primary" type="button" onClick={submitForm}>
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
