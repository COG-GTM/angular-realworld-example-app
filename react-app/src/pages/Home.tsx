import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArticleList } from '../components/ArticleList';
import { Tags } from '../services/api';
import { ArticleListConfig } from '../models';

export function Home() {
  const { tag } = useParams<{ tag: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, authState } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const feedType = searchParams.get('feed') || (tag ? 'tag' : isAuthenticated ? 'your' : 'global');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    Tags.getAll()
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setTagsLoading(false));
  }, []);

  const config: ArticleListConfig = (() => {
    if (tag) {
      return { type: 'all', filters: { tag, limit: 10 } };
    }
    if (feedType === 'your') {
      return { type: 'feed', filters: { limit: 10 } };
    }
    return { type: 'all', filters: { limit: 10 } };
  })();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    setSearchParams(params);
  };

  const setFeed = (type: string) => {
    if (tag) {
      navigate(`/?feed=${type}`);
    } else {
      setSearchParams({ feed: type });
    }
  };

  return (
    <div className="home-page">
      {!isAuthenticated && authState !== 'loading' && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font"><img src="/assets/conduit-logo.svg" alt="Conduit" className="banner-logo" /></h1>
            <p>
              This is the{' '}
              <a href="https://github.com/realworld-apps/angular-realworld-example-app">Angular frontend</a> demo from the{' '}
              <a href="https://github.com/realworld-apps/realworld">Realworld</a> project.<br />
              This demo is connected to a demo backend that enforces session isolation.
            </p>
          </div>
        </div>
      )}

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {isAuthenticated && (
                  <li className="nav-item">
                    <button
                      className={`nav-link${feedType === 'your' && !tag ? ' active' : ''}`}
                      onClick={() => setFeed('your')}
                    >
                      Your Feed
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className={`nav-link${feedType === 'global' && !tag ? ' active' : ''}`}
                    onClick={() => setFeed('global')}
                  >
                    Global Feed
                  </button>
                </li>
                {tag && (
                  <li className="nav-item">
                    <span className="nav-link active">
                      <i className="ion-pound"></i> {tag}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList
              config={config}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              {tagsLoading ? (
                <span>Loading tags...</span>
              ) : (
                <div className="tag-list">
                  {tags.map((t) => (
                    <Link
                      key={t}
                      to={`/tag/${t}`}
                      className="tag-pill tag-default"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
