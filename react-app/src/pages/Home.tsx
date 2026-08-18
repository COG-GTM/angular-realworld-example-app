import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import { useAuth } from '../context/AuthContext';
import { tagsApi } from '../services/api';
import type { ArticleListConfig } from '../models';
import './Home.css';

export default function Home() {
  const { isAuthenticated, authState } = useAuth();
  const { tag } = useParams<{ tag: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[] | null>(null);

  const feed = searchParams.get('feed');
  const currentPage = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : 1;

  useEffect(() => {
    tagsApi
      .getAll()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    if (feed === 'following' && authState !== 'loading' && !isAuthenticated) {
      navigate('/login');
    }
  }, [authState, feed, isAuthenticated, navigate]);

  const listConfig = useMemo<ArticleListConfig>(() => {
    if (tag) return { type: 'all', filters: { tag } };
    if (feed === 'following') return { type: 'feed', filters: {} };
    return { type: 'all', filters: {} };
  }, [feed, tag]);

  const onPageChange = (page: number) => {
    const params: Record<string, string> = {};
    if (feed) params.feed = feed;
    if (page > 1) params.page = String(page);
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
              This is the <a href="https://github.com/realworld-apps/angular-realworld-example-app">Angular frontend</a>{' '}
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
                    <Link className={listConfig.type === 'feed' ? 'nav-link active' : 'nav-link'} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={listConfig.type === 'all' && !listConfig.filters.tag ? 'nav-link active' : 'nav-link'}
                    to="/"
                  >
                    Global Feed
                  </Link>
                </li>
                <li className="nav-item" hidden={!listConfig.filters.tag}>
                  <a className="nav-link active">
                    <i className="ion-pound"></i> {listConfig.filters.tag}
                  </a>
                </li>
              </ul>
            </div>

            <ArticleList
              limit={10}
              config={listConfig}
              currentPage={currentPage}
              isFollowingFeed={listConfig.type === 'feed'}
              onPageChange={onPageChange}
            />
          </div>

          {tags !== null && (
            <div className="col-md-3">
              <div className="sidebar">
                <p>Popular Tags</p>

                <div className="tag-list">
                  {tags.map(item => (
                    <Link className="tag-default tag-pill" to={`/tag/${item}`} key={item}>
                      {item}
                    </Link>
                  ))}
                </div>

                <div hidden>Loading tags...</div>

                <div hidden={tags.length > 0}>No tags are here... yet.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
