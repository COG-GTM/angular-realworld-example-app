import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticle, createArticle, updateArticle } from '../services/articles.service';
import ListErrors from '../components/ListErrors';

function Editor() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      getArticle(slug).then((article) => {
        setTitle(article.title);
        setDescription(article.description);
        setBody(article.body);
        setTagList(article.tagList);
      }).catch(console.error);
    } else {
      setTitle('');
      setDescription('');
      setBody('');
      setTagList([]);
    }
  }, [slug]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tagList.includes(tag)) {
        setTagList([...tagList, tag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTagList(tagList.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors(null);
    try {
      const articleData = { title, description, body, tagList };
      const article = slug
        ? await updateArticle(slug, articleData)
        : await createArticle(articleData);
      navigate(`/article/${article.slug}`);
    } catch (err: unknown) {
      const errorObj = err as { errors?: Record<string, string[]> };
      setErrors(errorObj.errors || { '': ['An error occurred'] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ListErrors errors={errors} />
            <form onSubmit={handleSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input className="form-control form-control-lg" type="text" placeholder="Article Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <input className="form-control" type="text" placeholder="What's this article about?" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <textarea className="form-control" rows={8} placeholder="Write your article (in markdown)" name="body" value={body} onChange={(e) => setBody(e.target.value)} />
                </fieldset>
                <fieldset className="form-group">
                  <input className="form-control" type="text" placeholder="Enter tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span key={tag} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => handleRemoveTag(tag)} /> {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button className="btn btn-lg pull-xs-right btn-primary" type="submit" disabled={submitting}>
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

export default Editor;
