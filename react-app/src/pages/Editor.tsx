import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Articles } from '../services/api';

export function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      Articles.get(slug).then((article) => {
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
        setTagList(article.tagList);
      });
    }
  }, [slug]);

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tagList.includes(tag)) {
        setTagList([...tagList, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTagList(tagList.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const articleData = { title, description, body, tagList };
      let article;
      if (slug) {
        article = await Articles.update({ ...articleData, slug });
      } else {
        article = await Articles.create(articleData);
      }
      navigate(`/article/${article.slug}`);
    } catch (err: unknown) {
      const apiErr = err as { errors?: Record<string, string[]> };
      if (apiErr.errors) {
        setErrors(apiErr.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            {Object.keys(errors).length > 0 && (
              <ul className="error-messages">
                {Object.entries(errors).map(([key, messages]) =>
                  messages.map((msg) => (
                    <li key={`${key}-${msg}`}>
                      {key} {msg}
                    </li>
                  ))
                )}
              </ul>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Article Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  ></textarea>
                </fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span className="tag-default tag-pill" key={tag}>
                        <i
                          className="ion-close-round"
                          onClick={() => removeTag(tag)}
                        ></i>
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button
                  className="btn btn-lg pull-xs-right btn-primary"
                  type="submit"
                  disabled={submitting}
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
