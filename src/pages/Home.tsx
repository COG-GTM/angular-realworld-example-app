import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import { tagsService } from '../services/tags';
import { useAuth } from '../context/AuthContext';
import type { ArticleListConfig } from '../types';

/**
 * Home page: global feed, your feed (authenticated), and tag-filtered feed.
 * Reads `:tag` from the path and `feed`/`page` from the query string, matching
 * the Angular HomeComponent.
 */
export default function Home() {
  const { tag } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, authState } = useAuth();

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const feed = searchParams.get('feed');
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  // Redirect to login if requesting the following feed while unauthenticated.
  useEffect(() => {
    if (feed === 'following' && authState !== 'loading' && !isAuthenticated) {
      void navigate('/login');
    }
  }, [feed, isAuthenticated, authState, navigate]);

  const listConfig = useMemo<ArticleListConfig>(() => {
    if (tag) {
      return { type: 'all', filters: { tag } };
    }
    if (feed === 'following') {
      return { type: 'feed', filters: {} };
    }
    return { type: 'all', filters: {} };
  }, [tag, feed]);

  useEffect(() => {
    const controller = new AbortController();
    setTagsLoaded(false);
    tagsService
      .getAll(controller.signal)
      .then(result => {
        setTags(result);
        setTagsLoaded(true);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setTagsLoaded(true);
        }
      });
    return () => controller.abort();
  }, []);

  const onPageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (feed) {
      params.set('feed', feed);
    }
    if (newPage > 1) {
      params.set('page', String(newPage));
    }
    void navigate({ search: params.toString() });
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
              This is the{' '}
              <a href="https://github.com/realworld-apps/angular-realworld-example-app">React + TypeScript frontend</a>{' '}
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
                    <Link className={`nav-link${listConfig.type === 'feed' ? ' active' : ''}`} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={`nav-link${listConfig.type === 'all' && !listConfig.filters.tag ? ' active' : ''}`}
                    to="/"
                  >
                    Global Feed
                  </Link>
                </li>
                {listConfig.filters.tag && (
                  <li className="nav-item">
                    <a className="nav-link active">
                      <i className="ion-pound"></i> {listConfig.filters.tag}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList
              limit={10}
              config={listConfig}
              currentPage={page}
              isFollowingFeed={listConfig.type === 'feed'}
              onPageChange={onPageChange}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {tags.map(tag => (
                  <Link key={tag} className="tag-default tag-pill" to={`/tag/${tag}`}>
                    {tag}
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
