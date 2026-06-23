import { KeyboardEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Errors } from '../types';
import { articlesApi } from '../api/articles';
import { useAuth } from '../auth/AuthContext';
import { ListErrors } from '../components/ListErrors';

export default function Editor() {
  const { slug } = useParams<{ slug: string }>();
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
    if (slug) {
      articlesApi.get(slug).then(article => {
        if (currentUser?.username === article.author.username) {
          setTitle(article.title);
          setDescription(article.description);
          setBody(article.body);
          setTagList(article.tagList);
        } else {
          navigate('/');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, currentUser]);

  const addTagFrom = (value: string, currentTags: string[]): string[] => {
    if (value != null && value.trim() !== '' && currentTags.indexOf(value) < 0) {
      return [...currentTags, value];
    }
    return currentTags;
  };

  const addTag = () => {
    setTagList(prev => addTagFrom(tagField, prev));
    setTagField('');
  };

  const onTagKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      addTag();
    }
  };

  const removeTag = (tagName: string) => {
    setTagList(prev => prev.filter(tag => tag !== tagName));
  };

  const submitForm = () => {
    setIsSubmitting(true);
    // Commit any pending single tag, mirroring Angular's addTag() call on submit.
    const finalTags = addTagFrom(tagField, tagList);
    setTagList(finalTags);
    setTagField('');

    const articleData = { title, description, body, tagList: finalTags };

    const request = slug ? articlesApi.update({ ...articleData, slug }) : articlesApi.create(articleData);

    request.then(
      article => navigate(`/article/${article.slug}`),
      err => {
        setErrors(err);
        setIsSubmitting(false);
      },
    );
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
