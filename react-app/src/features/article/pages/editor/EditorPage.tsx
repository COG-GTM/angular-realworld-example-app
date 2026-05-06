import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArticlesService } from '../../services/articles.service';
import { useUser } from '../../../../core/auth/services/user.service';
import { ListErrors } from '../../../../shared/components/ListErrors';
import type { Errors } from '../../../../core/models/errors.model';

export function EditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);
  const [tagField, setTagField] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (slug && currentUser) {
      ArticlesService.get(slug).then((article) => {
        if (currentUser.username === article.author.username) {
          setTitle(article.title);
          setDescription(article.description);
          setBody(article.body);
          setTagList(article.tagList);
        } else {
          navigate('/');
        }
      });
    }
  }, [slug, currentUser, navigate]);

  const addTag = () => {
    const tag = tagField.trim();
    if (tag && !tagList.includes(tag)) {
      setTagList((prev) => [...prev, tag]);
    }
    setTagField('');
  };

  const removeTag = (tagName: string) => {
    setTagList((prev) => prev.filter((t) => t !== tagName));
  };

  const submitForm = () => {
    setIsSubmitting(true);

    const currentTag = tagField.trim();
    const finalTagList = currentTag && !tagList.includes(currentTag) ? [...tagList, currentTag] : tagList;
    setTagField('');

    const articleData = {
      title,
      description,
      body,
      tagList: finalTagList,
    };

    const observable = slug
      ? ArticlesService.update({ ...articleData, slug })
      : ArticlesService.create(articleData);

    observable
      .then((article) => navigate(`/article/${article.slug}`))
      .catch((err) => {
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
                    type="text"
                    placeholder="Article Title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="What's this article about?"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    name="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  ></textarea>
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={tagField}
                    onChange={(e) => setTagField(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span key={tag} className="tag-default tag-pill">
                        <i className="ion-close-round" onClick={() => removeTag(tag)}></i>
                        {' '}{tag}
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
