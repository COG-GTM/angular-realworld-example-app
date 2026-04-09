import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArticleList } from "../components/shared/ArticleList";
import { ArticleListConfig } from "../models/article.model";
import { TagsService } from "../services/tags.service";

type FeedType = "global" | "feed" | "tag";

export function Home() {
  const { tag: routeTag } = useParams<{ tag: string }>();
  const { authState } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<FeedType>(
    authState === "authenticated" ? "feed" : "global",
  );
  const [selectedTag, setSelectedTag] = useState<string | undefined>(
    routeTag,
  );

  useEffect(() => {
    TagsService.getAll()
      .then(setTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (routeTag) {
      setActiveTab("tag");
      setSelectedTag(routeTag);
    }
  }, [routeTag]);

  useEffect(() => {
    if (authState === "authenticated" && !routeTag) {
      setActiveTab("feed");
    } else if (authState === "unauthenticated" && activeTab === "feed") {
      setActiveTab("global");
    }
  }, [authState, routeTag, activeTab]);

  const handleTabClick = (tab: FeedType) => {
    setActiveTab(tab);
    if (tab !== "tag") {
      setSelectedTag(undefined);
    }
  };

  const handleTagClick = (tag: string) => {
    setActiveTab("tag");
    setSelectedTag(tag);
  };

  const config: ArticleListConfig = (() => {
    switch (activeTab) {
      case "feed":
        return { type: "feed", filters: {} };
      case "tag":
        return { type: "all", filters: { tag: selectedTag } };
      default:
        return { type: "all", filters: {} };
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
                    <button
                      className={`nav-link ${activeTab === "feed" ? "active" : ""}`}
                      onClick={() => handleTabClick("feed")}
                      style={{
                        cursor: "pointer",
                        border: "none",
                        background: "none",
                      }}
                    >
                      Your Feed
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "global" ? "active" : ""}`}
                    onClick={() => handleTabClick("global")}
                    style={{
                      cursor: "pointer",
                      border: "none",
                      background: "none",
                    }}
                  >
                    Global Feed
                  </button>
                </li>
                {activeTab === "tag" && selectedTag && (
                  <li className="nav-item">
                    <button
                      className="nav-link active"
                      style={{
                        cursor: "pointer",
                        border: "none",
                        background: "none",
                      }}
                    >
                      <i className="ion-pound"></i> {selectedTag}
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <ArticleList config={config} />
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
