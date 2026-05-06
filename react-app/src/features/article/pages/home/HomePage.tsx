import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../../../core/auth/services/user.service';
import type { ArticleListConfig } from '../../models/article-list-config.model';
import { ArticleList } from '../../components/ArticleList';
import { TagsService } from '../../services/tags.service';

export function HomePage() {
  const { tag } = useParams<{ tag?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, authState } = useUser();
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
    TagsService.getAll().then((t) => {
      setTags(t);
      setTagsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (authState === 'loading') return;

    if (feed === 'following' && !isAuthenticated) {
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
    if (feed) params.feed = feed;
    if (page > 1) params.page = String(page);
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
              <a href="https://github.com/realworld-apps/angular-realworld-example-app">Angular frontend</a> demo from
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
                {isAuthenticated && (
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
                {tags.map((t) => (
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
