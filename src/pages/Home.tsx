import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArticleList } from '../components/ArticleList';
import { tagsService } from '../services/tags';
import { useAuth } from '../auth/AuthContext';
import type { ArticleListConfig } from '../types/article-list-config';
import './Home.css';

export default function Home() {
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, authState } = useAuth();

  const [listConfig, setListConfig] = useState<ArticleListConfig>({ type: 'all', filters: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const [isFollowingFeed, setIsFollowingFeed] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  useEffect(() => {
    tagsService
      .getAll()
      .then(loadedTags => {
        setTags(loadedTags);
        setTagsLoaded(true);
      })
      .catch(() => {
        setTagsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (authState === 'loading') {
      return;
    }

    const feed = searchParams.get('feed');
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // Feed=following requires authentication.
    if (feed === 'following' && !isAuthenticated) {
      navigate('/login');
      return;
    }

    let type = 'all';
    let filters: ArticleListConfig['filters'] = {};

    if (tag) {
      type = 'all';
      filters = { tag };
    } else if (feed === 'following') {
      type = 'feed';
    } else {
      type = 'all';
    }

    setCurrentPage(page);
    setListConfig({ type, filters });
    setIsFollowingFeed(type === 'feed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag, searchParams, isAuthenticated, authState]);

  const onPageChange = (page: number) => {
    const params = new URLSearchParams();
    const currentFeed = searchParams.get('feed');
    if (currentFeed) {
      params.set('feed', currentFeed);
    }
    if (page > 1) {
      params.set('page', String(page));
    }
    setSearchParams(params);
  };

  const globalFeedActive = listConfig.type === 'all' && !listConfig.filters.tag;

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
                    <Link className={'nav-link' + (listConfig.type === 'feed' ? ' active' : '')} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className={'nav-link' + (globalFeedActive ? ' active' : '')} to="/">
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
