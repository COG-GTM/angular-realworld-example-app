import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArticleListConfig } from '../types';
import { tagsApi } from '../api/tags';
import { useAuth } from '../auth/AuthContext';
import { ArticleList } from '../components/ArticleList';

export default function Home() {
  const { isAuthenticated, authState } = useAuth();
  const { tag } = useParams<{ tag: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  useEffect(() => {
    tagsApi.getAll().then(result => {
      setTags(result);
      setTagsLoaded(true);
    });
  }, []);

  // If feed=following but not authenticated, redirect to login.
  useEffect(() => {
    if (authState !== 'loading' && feed === 'following' && !isAuthenticated) {
      navigate('/login');
    }
  }, [authState, feed, isAuthenticated, navigate]);

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

  const onPageChange = (page: number) => {
    const params = new URLSearchParams();
    if (feed) {
      params.set('feed', feed);
    }
    if (page > 1) {
      params.set('page', String(page));
    }
    const query = params.toString();
    navigate({ pathname: tag ? `/tag/${tag}` : '/', search: query ? `?${query}` : '' });
  };

  const feedActive = listConfig.type === 'feed';
  const globalActive = listConfig.type === 'all' && !listConfig.filters.tag;

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
                    <Link className={`nav-link${feedActive ? ' active' : ''}`} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className={`nav-link${globalActive ? ' active' : ''}`} to="/">
                    Global Feed
                  </Link>
                </li>
                <li className="nav-item" hidden={!listConfig.filters.tag}>
                  <a className="nav-link active">
                    {' '}
                    <i className="ion-pound"></i> {listConfig.filters.tag}{' '}
                  </a>
                </li>
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

              <div hidden={tagsLoaded}>Loading tags...</div>
              <div hidden={!tagsLoaded || tags.length > 0}>No tags are here... yet.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
