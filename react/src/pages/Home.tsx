import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { tagsApi } from '../api/services';
import { ArticleList } from '../components/ArticleList';
import { useUser } from '../context/UserContext';
import type { ArticleListConfig } from '../types';

type FeedType = 'all' | 'feed' | 'tag';

export function Home() {
  const { tag } = useParams();
  const { authState } = useUser();
  const isAuthenticated = authState === 'authenticated';
  const [feedType, setFeedType] = useState<FeedType>(tag ? 'tag' : isAuthenticated ? 'feed' : 'all');
  const [tags, setTags] = useState<string[] | null>(null);

  useEffect(() => {
    setFeedType(tag ? 'tag' : isAuthenticated ? 'feed' : 'all');
  }, [tag, isAuthenticated]);

  useEffect(() => {
    tagsApi
      .getAll()
      .then(({ tags }) => setTags(tags))
      .catch(() => setTags([]));
  }, []);

  const config: ArticleListConfig = useMemo(() => {
    if (feedType === 'feed') return { type: 'feed', filters: {} };
    if (feedType === 'tag' && tag) return { type: 'all', filters: { tag } };
    return { type: 'all', filters: {} };
  }, [feedType, tag]);

  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {isAuthenticated && (
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${feedType === 'feed' ? 'active' : ''}`}
                      onClick={() => setFeedType('feed')}
                    >
                      Your Feed
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link ${feedType === 'all' ? 'active' : ''}`}
                    onClick={() => setFeedType('all')}
                  >
                    Global Feed
                  </button>
                </li>
                {feedType === 'tag' && tag && (
                  <li className="nav-item">
                    <span className="nav-link active">
                      <i className="ion-pound"></i> {tag}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList config={config} />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              {tags === null ? (
                <div className="post-preview">Loading tags...</div>
              ) : (
                <div className="tag-list">
                  {tags.map(t => (
                    <Link key={t} to={`/tag/${t}`} className="tag-default tag-pill">
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
