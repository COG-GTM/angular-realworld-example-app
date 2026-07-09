import { useEffect, useState, type KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Errors } from '../../../core/models/errors';
import { useUser } from '../../../core/auth/user-context';
import { ListErrors } from '../../../shared/components/list-errors';
import * as articlesService from '../services/articles.service';

interface ArticleForm {
  title: string;
  description: string;
  body: string;
}

export function Editor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getCurrentUser } = useUser();

  const { register, handleSubmit, reset, getValues } = useForm<ArticleForm>({
    defaultValues: { title: '', description: '', body: '' },
  });

  const [tagList, setTagList] = useState<string[]>([]);
  const [tagField, setTagField] = useState('');
  const [errors, setErrors] = useState<Errors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (slug) {
      Promise.all([articlesService.getArticle(slug), getCurrentUser()])
        .then(([article, { user }]) => {
          if (!active) {
            return;
          }
          if (user.username === article.author.username) {
            setTagList(article.tagList);
            reset({ title: article.title, description: article.description, body: article.body });
          } else {
            navigate('/');
          }
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
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

  const removeTag = (tagName: string): void => {
    setTagList(tags => tags.filter(tag => tag !== tagName));
  };

  const onTagKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    const finalTags = addTag();
    const articleData = { ...getValues(), tagList: finalTags };

    try {
      const article = slug
        ? await articlesService.updateArticle({ ...articleData, slug })
        : await articlesService.createArticle(articleData);
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

            <form onSubmit={handleSubmit(submitForm)}>
              <fieldset disabled={isSubmitting}>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Article Title"
                    {...register('title')}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="What's this article about?"
                    {...register('description')}
                  />
                </fieldset>

                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    {...register('body')}
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

export default Editor;
