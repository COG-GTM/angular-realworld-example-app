import { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArticleList } from "../components/shared/ArticleList";
import { ArticleListConfig } from "../models/article.model";
import { TagsService } from "../services/tags.service";

type FeedType = "global" | "feed" | "tag";

export function Home() {
  const { tag: routeTag } = useParams<{ tag: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [tags, setTags] = useState<string[]>([]);

  const feedParam = searchParams.get("feed");
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  const activeTab: FeedType = (() => {
    if (routeTag) return "tag";
    if (feedParam === "following") return "feed";
    return "global";
  })();

  const selectedTag = routeTag;

  useEffect(() => {
    TagsService.getAll()
      .then(setTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (feedParam === "following" && authState === "unauthenticated") {
      navigate("/login", { replace: true });
    }
  }, [feedParam, authState, navigate]);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (feedParam) params.set("feed", feedParam);
      if (page > 1) params.set("page", String(page));
      const search = params.toString();

      if (routeTag) {
        navigate(`/tag/${routeTag}${search ? `?${search}` : ""}`);
      } else {
        navigate(`/${search ? `?${search}` : ""}`);
      }
    },
    [feedParam, routeTag, navigate],
  );

  const handleTagClick = (tag: string) => {
    navigate(`/tag/${tag}`);
  };

  const config: ArticleListConfig = (() => {
    switch (activeTab) {
      case "feed":
        return { type: "feed" as const, filters: {} };
      case "tag":
        return { type: "all" as const, filters: { tag: selectedTag } };
      default:
        return { type: "all" as const, filters: {} };
    }
  })();

  return (
    <div className="home-page">
      {authState !== "authenticated" && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">conduit</h1>
            <p>A place to share your knowledge.</p>
          </div>
        </div>
      )}

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {authState === "authenticated" && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${activeTab === "feed" ? "active" : ""}`}
                      to="/?feed=following"
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link
                    className={`nav-link ${activeTab === "global" ? "active" : ""}`}
                    to="/"
                  >
                    Global Feed
                  </Link>
                </li>
                {activeTab === "tag" && selectedTag && (
                  <li className="nav-item">
                    <Link
                      className="nav-link active"
                      to={`/tag/${selectedTag}`}
                    >
                      <i className="ion-pound"></i> {selectedTag}
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList
              config={config}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              emptyMessage={activeTab === "feed" ? "feed" : undefined}
            />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              {tags.length > 0 ? (
                <div className="tag-list">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      className="tag-pill tag-default"
                      onClick={() => handleTagClick(tag)}
                      style={{
                        cursor: "pointer",
                        border: "none",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <span>Loading tags...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
