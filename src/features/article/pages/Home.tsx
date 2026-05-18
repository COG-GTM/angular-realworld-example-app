import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { tagsService } from '../../../services/tags.service';
import { ArticleList } from '../components/ArticleList';
import type { ArticleListConfig } from '../../../models/article.model';

export function Home() {
  const { isAuthenticated, authState } = useAuth();
  const { tag } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const [listConfig, setListConfig] = useState<ArticleListConfig>({
    type: 'all',
    filters: {},
  });
  const [isFollowingFeed, setIsFollowingFeed] = useState(false);

  useEffect(() => {
    tagsService.getAll().then(t => {
      setTags(t);
      setTagsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (feed === 'following' && !isAuthenticated && authState !== 'loading') {
      navigate('/login');
      return;
    }

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

    setListConfig({ type, filters });
    setIsFollowingFeed(type === 'feed');
  }, [tag, feed, isAuthenticated, authState, navigate]);

  const onPageChange = (page: number) => {
    const params: Record<string, string> = {};
    if (feed) params['feed'] = feed;
    if (page > 1) params['page'] = String(page);
    navigate({ search: new URLSearchParams(params).toString() });
  };

  return (
    <div className="home-page">
      {authState === 'unauthenticated' && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="/assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
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
                      className={`nav-link ${listConfig.type === 'feed' ? 'active' : ''}`}
                      to="/?feed=following"
                      style={{ cursor: 'pointer' }}
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={`nav-link ${listConfig.type === 'all' && !listConfig.filters.tag ? 'active' : ''}`}
                    to="/"
                    style={{ cursor: 'pointer' }}
                  >
                    Global Feed
                  </Link>
                </li>
                {listConfig.filters.tag && (
                  <li className="nav-item">
                    <span className="nav-link active">
                      <i className="ion-pound"></i> {listConfig.filters.tag}
                    </span>
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
                  <Link key={t} className="tag-default tag-pill" to={`/tag/${t}`} style={{ cursor: 'pointer' }}>
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
