import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ListErrors } from '../components/ListErrors';
import type { ApiError } from '../api/client';

export function Editor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagField, setTagField] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);

  const [errors, setErrors] = useState<ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      articlesApi.get(slug).then(article => {
        if (currentUser && currentUser.username === article.author.username) {
          setTagList(article.tagList);
          setTitle(article.title);
          setDescription(article.description);
          setBody(article.body);
        } else {
          void navigate('/');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const addTag = (): string[] => {
    const tag = tagField;
    let nextTags = tagList;
    if (tag != null && tag.trim() !== '' && tagList.indexOf(tag) < 0) {
      nextTags = [...tagList, tag];
      setTagList(nextTags);
    }
    setTagField('');
    return nextTags;
  };

  const removeTag = (tagName: string) => {
    setTagList(tags => tags.filter(tag => tag !== tagName));
  };

  const onTagKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addTag();
    }
  };

  const submitForm = () => {
    setIsSubmitting(true);
    const tags = addTag();

    const articleData = { title, description, body, tagList: tags };

    const request = slug ? articlesApi.update({ ...articleData, slug }) : articlesApi.create(articleData);

    request
      .then(article => {
        void navigate(`/article/${article.slug}`);
      })
      .catch((err: ApiError) => {
        setErrors(err);
        setIsSubmitting(false);
      });
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
