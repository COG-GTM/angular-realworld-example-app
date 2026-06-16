import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as articlesApi from '../api/articles';
import type { Errors } from '../types/errors';
import { ListErrors } from '../components/ListErrors';

export function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagField, setTagField] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    articlesApi
      .get(slug)
      .then(article => {
        if (cancelled) return;
        if (currentUser && currentUser.username === article.author.username) {
          setTitle(article.title);
          setDescription(article.description);
          setBody(article.body);
          setTagList(article.tagList);
        } else {
          navigate('/');
        }
      })
      .catch(() => {
        if (cancelled) return;
        navigate('/');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentUser?.username]);

  const addTag = () => {
    const tag = tagField.trim();
    if (tag !== '' && tagList.indexOf(tag) < 0) {
      setTagList(tags => [...tags, tag]);
    }
    setTagField('');
  };

  const onTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagName: string) => {
    setTagList(tags => tags.filter(tag => tag !== tagName));
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    // Commit any pending tag synchronously (state updates are async).
    const pending = tagField.trim();
    const finalTags = pending !== '' && tagList.indexOf(pending) < 0 ? [...tagList, pending] : tagList;
    setTagList(finalTags);
    setTagField('');

    const articleData = { title, description, body, tagList: finalTags };

    try {
      const article = slug ? await articlesApi.update({ ...articleData, slug }) : await articlesApi.create(articleData);
      navigate(`/article/${article.slug}`);
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
                    onKeyDown={onTagKeyDown}
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
