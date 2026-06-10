import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import type { ArticleListConfig } from '../types';
import { useAuth } from '../hooks/useAuth';
import { getTags } from '../api/tags';
import { ArticleList } from '../components/ArticleList';

/**
 * Replaces the Angular `HomeComponent`. Drives the feed type from the route
 * (`/tag/:tag`) and query params (`feed=following`, `page=N`).
 */
export function HomePage() {
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, authState } = useAuth();

  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getTags(controller.signal)
      .then(data => {
        setTags(data);
        setTagsLoaded(true);
      })
      .catch(err => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setTagsLoaded(true);
        }
      });
    return () => controller.abort();
  }, []);

  const listConfig = useMemo<ArticleListConfig>(() => {
    if (tag) {
      return { type: 'all', filters: { tag } };
    }
    if (feed === 'following') {
      return { type: 'feed', filters: {} };
    }
    return { type: 'all', filters: {} };
  }, [tag, feed]);

  const isFollowingFeed = listConfig.type === 'feed';

  const onPageChange = (page: number) => {
    const next: Record<string, string> = {};
    if (feed) {
      next.feed = feed;
    }
    if (page > 1) {
      next.page = String(page);
    }
    setSearchParams(next);
  };

  // If feed=following but not authenticated, redirect to login (once auth resolved).
  if (feed === 'following' && authState !== 'loading' && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
              currentPage={currentPage}
              isFollowingFeed={isFollowingFeed}
              onPageChange={onPageChange}
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
