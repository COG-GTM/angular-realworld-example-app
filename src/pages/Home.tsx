import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import * as tagsApi from '../api/tags';
import type { ArticleListConfig } from '../types/article';
import { ArticleList } from '../components/ArticleList';
import { cx } from '../utils/cx';

export function Home() {
  const { tag } = useParams<{ tag: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authState, isAuthenticated } = useAuth();

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    tagsApi
      .getAll()
      .then(result => {
        if (cancelled) return;
        setTags(result);
        setTagsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Tags failing to load shouldn't break the page; mark loaded with none.
        setTagsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const { config, isFollowingFeed } = useMemo(() => {
    let type: string;
    let filters: ArticleListConfig['filters'] = {};
    if (tag) {
      type = 'all';
      filters = { tag };
    } else if (feed === 'following') {
      type = 'feed';
    } else {
      type = 'all';
    }
    return { config: { type, filters }, isFollowingFeed: type === 'feed' };
  }, [tag, feed]);

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

  // Wait for the initial auth check before deciding feed access / banner.
  if (authState === 'loading') {
    return null;
  }

  // Your Feed requires authentication.
  if (feed === 'following' && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const globalActive = config.type === 'all' && !config.filters.tag;

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="/assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
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
                    <Link className={cx('nav-link', { active: config.type === 'feed' })} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className={cx('nav-link', { active: globalActive })} to="/">
                    Global Feed
                  </Link>
                </li>
                {config.filters.tag && (
                  <li className="nav-item">
                    <a className="nav-link active">
                      <i className="ion-pound"></i> {config.filters.tag}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList
              limit={10}
              config={config}
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
