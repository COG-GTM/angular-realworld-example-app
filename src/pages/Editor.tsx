import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getArticle, createArticle, updateArticle } from '../api';
import { ListErrors } from '../components';
import type { Errors } from '../types';

export default function Editor() {
  const { slug } = useParams<{ slug?: string }>();
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

    getArticle(slug).then(article => {
      if (user && user.username === article.author.username) {
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
        setTagList(article.tagList);
      } else {
        navigate('/');
      }
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

  const handleTagKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    addTag();

    try {
      const articleData = { title, description, body, tagList };
      const article = slug ? await updateArticle({ ...articleData, slug }) : await createArticle(articleData);
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

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    name="title"
                    placeholder="Article Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    name="description"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    name="body"
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
                    onKeyUp={handleTagKeyUp}
                  />
                  <div className="tag-list">
                    {tagList.map(tag => (
                      <span key={tag} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => removeTag(tag)}></i>
                        {' ' + tag}
                      </span>
                    ))}
                  </div>
                </fieldset>

                <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
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
