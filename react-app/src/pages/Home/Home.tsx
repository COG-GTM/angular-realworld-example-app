import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTags } from '../../services/tags.service';
import { ArticleList } from '../../components/ArticleList/ArticleList';
import type { ArticleListConfig } from '../../types';

export default function Home() {
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  // Redirect if feed=following but not authenticated
  useEffect(() => {
    if (feed === 'following' && !user) {
      navigate('/login');
    }
  }, [feed, user, navigate]);

  const listConfig: ArticleListConfig = useMemo(() => {
    if (tag) {
      return { type: 'all', filters: { tag } };
    } else if (feed === 'following') {
      return { type: 'feed', filters: {} };
    }
    return { type: 'all', filters: {} };
  }, [tag, feed]);
  const isFollowingFeed = listConfig.type === 'feed';

  // Load tags
  useEffect(() => {
    const controller = new AbortController();
    getTags(controller.signal)
      .then(t => {
        setTags(t);
        setTagsLoaded(true);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setTagsLoaded(true);
      });
    return () => controller.abort();
  }, []);

  const onPageChange = (page: number) => {
    const params: Record<string, string> = {};
    if (feed) params.feed = feed;
    if (page > 1) params.page = String(page);
    setSearchParams(params);
  };

  return (
    <div className="home-page">
      {!user && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img src="/assets/conduit-logo.svg" alt="Conduit" className="banner-logo" />
            </h1>
            <p>
              This is the{' '}
              <a href="https://github.com/realworld-apps/angular-realworld-example-app">React frontend</a> demo from
              the <a href="https://github.com/realworld-apps/realworld">Realworld</a> project.
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
                {user && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link${listConfig.type === 'feed' ? ' active' : ''}`}
                      to="/?feed=following"
                    >
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
              config={listConfig}
              limit={10}
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
