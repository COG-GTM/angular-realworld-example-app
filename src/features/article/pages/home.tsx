import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArticleListConfig } from '../models/article-list-config';
import { ArticleList } from '../components/article-list';
import { useUser } from '../../../core/auth/user-context';
import { IfAuthenticated } from '../../../core/auth/if-authenticated';
import * as tagsService from '../services/tags.service';

import './home.css';

export function Home() {
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const { isAuthenticated, initialized } = useUser();
  const navigate = useNavigate();

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    tagsService
      .getAll()
      .then(result => {
        if (active) {
          setTags(result);
          setTagsLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setTagsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // If feed=following but not authenticated, redirect to login (once the
  // startup auth check has completed so we don't reject a valid token).
  useEffect(() => {
    if (initialized && feed === 'following' && !isAuthenticated) {
      navigate('/login');
    }
  }, [initialized, feed, isAuthenticated, navigate]);

  const listConfig = useMemo<ArticleListConfig>(() => {
    if (tag) {
      return { type: 'all', filters: { tag } };
    }
    if (feed === 'following') {
      return { type: 'feed', filters: {} };
    }
    return { type: 'all', filters: {} };
  }, [tag, feed]);

  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
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

  return (
    <div className="home-page">
      <IfAuthenticated when={false}>
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
      </IfAuthenticated>

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                <IfAuthenticated when={true}>
                  <li className="nav-item">
                    <Link className={'nav-link' + (listConfig.type === 'feed' ? ' active' : '')} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                </IfAuthenticated>
                <li className="nav-item">
                  <Link
                    className={'nav-link' + (listConfig.type === 'all' && !listConfig.filters.tag ? ' active' : '')}
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

export default Home;
