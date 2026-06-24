import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTags } from '../api';
import { ArticleList } from '../components';
import type { ArticleListConfig } from '../types';

export default function Home() {
  const { tag } = useParams<{ tag?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const feed = searchParams.get('feed');
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    if (feed === 'following' && !isAuthenticated) {
      navigate('/login');
    }
  }, [feed, isAuthenticated, navigate]);

  useEffect(() => {
    getTags().then(t => {
      setTags(t);
      setTagsLoaded(true);
    });
  }, []);

  const listConfig: ArticleListConfig = useMemo(() => {
    if (tag) {
      return { type: 'all', filters: { tag } };
    }
    if (feed === 'following') {
      return { type: 'feed', filters: {} };
    }
    return { type: 'all', filters: {} };
  }, [tag, feed]);

  const isFollowingFeed = listConfig.type === 'feed';

  const handlePageChange = (newPage: number) => {
    const params: Record<string, string> = {};
    if (feed) params.feed = feed;
    if (newPage > 1) params.page = String(newPage);
    setSearchParams(params);
  };

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
            </h1>
            <p>
              This is the <a href="https://github.com/realworld-apps/angular-realworld-example-app">React frontend</a>{' '}
              demo from the <a href="https://github.com/realworld-apps/realworld">Realworld</a> project.
              <br />
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
                    <Link
                      className={`nav-link${isFollowingFeed ? ' active' : ''}`}
                      to="/?feed=following"
                      style={{ cursor: 'pointer' }}
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={`nav-link${listConfig.type === 'all' && !tag ? ' active' : ''}`}
                    to="/"
                    style={{ cursor: 'pointer' }}
                  >
                    Global Feed
                  </Link>
                </li>
                {tag && (
                  <li className="nav-item">
                    <a className="nav-link active">
                      <i className="ion-pound"></i> {tag}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList
              config={listConfig}
              limit={10}
              currentPage={page}
              isFollowingFeed={isFollowingFeed}
              onPageChange={handlePageChange}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {tags.map(t => (
                  <Link key={t} className="tag-default tag-pill" to={`/tag/${t}`}>
                    {t}
                  </Link>
                ))}
              </div>

              {!tagsLoaded && <div>Loading tags...</div>}

              {tagsLoaded && tags.length === 0 && <div>No tags are here... yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
