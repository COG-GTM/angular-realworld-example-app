import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tagsService } from '../services/tags';
import { ArticleList } from '../components/article/ArticleList';
import type { ArticleListConfig } from '../types';

export function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { tag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  const feed = searchParams.get('feed');
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const isFollowing = feed === 'following';

  useEffect(() => {
    if (isFollowing && !isAuthenticated) {
      void navigate('/login');
    }
  }, [isFollowing, isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    tagsService
      .getAll()
      .then(result => {
        if (cancelled) return;
        setTags(result);
        setTagsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setTagsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo<ArticleListConfig>(() => {
    if (tag) {
      return { type: 'all', filters: { tag } };
    }
    if (isFollowing) {
      return { type: 'feed', filters: {} };
    }
    return { type: 'all', filters: {} };
  }, [tag, isFollowing]);

  const onPageChange = (page: number) => {
    const next = new URLSearchParams();
    if (feed) {
      next.set('feed', feed);
    }
    if (page > 1) {
      next.set('page', String(page));
    }
    setSearchParams(next);
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
                    <Link className={`nav-link${config.type === 'feed' ? ' active' : ''}`} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className={`nav-link${config.type === 'all' && !config.filters.tag ? ' active' : ''}`} to="/">
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
              isFollowingFeed={config.type === 'feed'}
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
