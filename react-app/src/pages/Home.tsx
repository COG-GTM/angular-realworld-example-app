import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { tagsApi } from '../api/services';
import { ArticleList } from '../components/ArticleList';
import { useAuth } from '../auth/AuthContext';
import type { ArticleListConfig } from '../types';

export function Home() {
  const { isAuthenticated } = useAuth();
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const feed = searchParams.get('feed');
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  useEffect(() => {
    if (feed === 'following' && !isAuthenticated) {
      void navigate('/login');
    }
  }, [feed, isAuthenticated, navigate]);

  useEffect(() => {
    tagsApi.getAll().then(result => {
      setTags(result);
      setTagsLoaded(true);
    });
  }, []);

  const { listConfig, isFollowingFeed } = useMemo(() => {
    let type: string;
    let filters: { tag?: string } = {};

    if (tag) {
      type = 'all';
      filters = { tag };
    } else if (feed === 'following') {
      type = 'feed';
    } else {
      type = 'all';
    }

    const config: ArticleListConfig = { type, filters };
    return { listConfig: config, isFollowingFeed: type === 'feed' };
  }, [tag, feed]);

  const onPageChange = (nextPage: number) => {
    const params: Record<string, string> = {};
    if (feed) {
      params.feed = feed;
    }
    if (nextPage > 1) {
      params.page = String(nextPage);
    }
    setSearchParams(params);
  };

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="/assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
            </h1>
            <p>
              This is the{' '}
              <a href="https://github.com/realworld-apps/angular-realworld-example-app">Angular frontend</a> demo from the{' '}
              <a href="https://github.com/realworld-apps/realworld">Realworld</a> project.
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
                      className={listConfig.type === 'feed' ? 'nav-link active' : 'nav-link'}
                      to="/?feed=following"
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={
                      listConfig.type === 'all' && !listConfig.filters.tag ? 'nav-link active' : 'nav-link'
                    }
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
              isFollowingFeed={isFollowingFeed}
              onPageChange={onPageChange}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {tags.map(tagName => (
                  <Link key={tagName} className="tag-default tag-pill" to={`/tag/${tagName}`}>
                    {tagName}
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
