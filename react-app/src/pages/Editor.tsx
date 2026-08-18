import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ListErrors } from '../components/ListErrors';
import { articlesApi, usersApi } from '../services/api';
import type { ApiError } from '../services/api';
import type { Errors } from '../models';

export default function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagField, setTagField] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    Promise.all([articlesApi.get(slug), usersApi.current()])
      .then(([article, { user }]) => {
        if (cancelled) return;
        if (user.username !== article.author.username) {
          navigate('/');
          return;
        }
        setTagList(article.tagList);
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [navigate, slug]);

  const addTag = (tags: string[], tag: string): string[] =>
    tag.trim() !== '' && tags.indexOf(tag) < 0 ? [...tags, tag] : tags;

  const onTagKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    setTagList(tags => addTag(tags, tagField));
    setTagField('');
  };

  const removeTag = (tagName: string) => setTagList(tags => tags.filter(tag => tag !== tagName));

  const submitForm = async () => {
    setIsSubmitting(true);
    const tags = addTag(tagList, tagField);
    setTagList(tags);
    setTagField('');

    const articleData = { title, description, body, tagList: tags };

    try {
      const article = slug ? await articlesApi.update({ ...articleData, slug }) : await articlesApi.create(articleData);
      navigate(`/article/${article.slug}`);
    } catch (error) {
      setErrors(error as ApiError);
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
                    onChange={event => setTitle(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    name="description"
                    type="text"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={event => setDescription(event.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    name="body"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={event => setBody(event.target.value)}
                  ></textarea>
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagField}
                    onChange={event => setTagField(event.target.value)}
                    onKeyUp={onTagKeyUp}
                  />
                  <div className="tag-list">
                    {tagList.map(tag => (
                      <span className="tag-default tag-pill" key={tag}>
                        <i className="ion-close-round" onClick={() => removeTag(tag)}></i> {tag}{' '}
                      </span>
                    ))}
                  </div>
                </fieldset>

                <button
                  className="btn btn-lg pull-xs-right btn-primary"
                  type="button"
                  onClick={() => void submitForm()}
                >
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
