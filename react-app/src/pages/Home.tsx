import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTags } from '../services/tags.service';
import { ArticleListConfig } from '../models/article';
import ArticleList from '../components/ArticleList';
import TagList from '../components/TagList';

function Home() {
  const { tag } = useParams<{ tag: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const feed = searchParams.get('feed');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  useEffect(() => {
    getTags().then(setTags).catch(console.error).finally(() => setTagsLoading(false));
  }, []);

  useEffect(() => {
    if (feed === 'following' && !isAuthenticated) {
      navigate('/login');
    }
  }, [feed, isAuthenticated, navigate]);

  const listConfig: ArticleListConfig = useMemo(() => tag
    ? { type: 'all', filters: { tag } }
    : feed === 'following'
      ? { type: 'feed', filters: {} }
      : { type: 'all', filters: {} }, [tag, feed]);

  const handlePageChange = useCallback((page: number) => {
    const params: Record<string, string> = {};
    if (feed) params.feed = feed;
    if (page > 1) params.page = String(page);
    setSearchParams(params);
  }, [feed, setSearchParams]);

  const isGlobalFeed = !tag && feed !== 'following';
  const isYourFeed = feed === 'following';

  return (
    <div className="home-page">
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">Conduit</h1>
            <p>This is the <a href="https://github.com/nicolestandifer3/angular-realworld-example-app-1">Angular frontend</a> demo from the <a href="https://github.com/gothinkster/realworld">Realworld</a> project.</p>
            <p>This demo is connected to a demo backend that enforces session isolation.</p>
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
                    <a
                      className={`nav-link ${isYourFeed ? 'active' : ''}`}
                      href=""
                      onClick={(e) => { e.preventDefault(); setSearchParams({ feed: 'following' }); }}
                    >
                      Your Feed
                    </a>
                  </li>
                )}
                <li className="nav-item">
                  <a
                    className={`nav-link ${isGlobalFeed ? 'active' : ''}`}
                    href=""
                    onClick={(e) => { e.preventDefault(); setSearchParams({}); navigate('/'); }}
                  >
                    Global Feed
                  </a>
                </li>
                {tag && (
                  <li className="nav-item">
                    <span className="nav-link active">
                      <i className="ion-pound" /> {tag}
                    </span>
                  </li>
                )}
              </ul>
            </div>
            <ArticleList config={listConfig} currentPage={currentPage} onPageChange={handlePageChange} />
          </div>
          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              {tagsLoading ? <p>Loading tags...</p> : <TagList tags={tags} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
