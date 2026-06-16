import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { articlesService } from '../services/articles';
import { ListErrors } from '../components/ListErrors';
import type { Errors } from '../types';

export function Editor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    articlesService
      .get(slug)
      .then(article => {
        if (cancelled) return;
        if (user && user.username === article.author.username) {
          setTitle(article.title);
          setDescription(article.description);
          setBody(article.body);
          setTagList(article.tagList);
        } else {
          void navigate('/');
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug, user, navigate]);

  const addTag = (): string[] => {
    const tag = tagField.trim();
    let nextTags = tagList;
    if (tag !== '' && tagList.indexOf(tag) < 0) {
      nextTags = [...tagList, tag];
      setTagList(nextTags);
    }
    setTagField('');
    return nextTags;
  };

  const onTagKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
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
    const tags = addTag();
    const articleData = { title, description, body, tagList: tags };

    try {
      const article = slug
        ? await articlesService.update({ ...articleData, slug })
        : await articlesService.create(articleData);
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
