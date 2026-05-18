import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { articlesService } from '../../../services/articles.service';
import { ListErrors } from '../../../components/ListErrors';
import type { Errors } from '../../../models/errors.model';

export function Editor() {
  const { slug } = useParams<{ slug: string }>();
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
    articlesService.get(slug).then(article => {
      if (user?.username !== article.author.username) {
        navigate('/');
        return;
      }
      setTitle(article.title);
      setDescription(article.description);
      setBody(article.body);
      setTagList(article.tagList);
    });
  }, [slug, user, navigate]);

  const addTag = () => {
    const tag = tagField.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList(prev => [...prev, tag]);
    }
    setTagField('');
  };

  const removeTag = (tagName: string) => {
    setTagList(prev => prev.filter(t => t !== tagName));
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    const trimmedTag = tagField.trim();
    const finalTagList = trimmedTag && !tagList.includes(trimmedTag) ? [...tagList, trimmedTag] : tagList;
    setTagList(finalTagList);
    setTagField('');

    const articleData = {
      title,
      description,
      body,
      tagList: finalTagList,
    };

    try {
      const article = slug
        ? await articlesService.update({ ...articleData, slug })
        : await articlesService.create(articleData);
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
                    type="text"
                    placeholder="Article Title"
                    name="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="What's this article about?"
                    name="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    name="body"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagField}
                    onChange={e => setTagField(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <div className="tag-list">
                    {tagList.map(t => (
                      <span key={t} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => removeTag(t)}></i>
                        {t}
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
