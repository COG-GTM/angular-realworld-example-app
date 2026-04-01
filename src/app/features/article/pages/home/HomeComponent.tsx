import { useState, useEffect, useCallback } from "react";

/**
 * Mirrors the Angular ArticleListConfig interface.
 * @see src/app/features/article/models/article-list-config.model.ts
 */
interface ArticleListConfig {
  type: string;
  filters: {
    tag?: string;
    author?: string;
    favorited?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Props for HomeComponent.
 *
 * In the Angular version, these values come from injected services
 * (UserService, ActivatedRoute) and the TagsService. In the React
 * version they are passed as props so the component remains pure.
 */
interface HomeComponentProps {
  /** Whether the current user is authenticated */
  isAuthenticated: boolean;

  /** Current route tag param (from URL like /tag/:tag) */
  tag?: string;

  /** Current query param for feed type (e.g. "following") */
  feed?: string;

  /** Current page number from query params, defaults to 1 */
  page?: number;

  /** List of popular tags fetched from the API */
  tags: string[];

  /** Whether tags have finished loading */
  tagsLoaded: boolean;

  /**
   * Callback to navigate when the user changes page.
   * Mirrors Angular's router.navigate with queryParams.
   */
  onPageChange: (page: number, feed?: string) => void;

  /**
   * Callback to navigate to login page.
   * Called when an unauthenticated user tries to view the following feed.
   */
  onNavigateToLogin: () => void;

  /**
   * Callback to navigate to a tag feed.
   * Called when a user clicks a tag pill.
   */
  onNavigateToTag: (tag: string) => void;

  /**
   * Callback to navigate to the following feed.
   */
  onNavigateToFollowingFeed: () => void;

  /**
   * Callback to navigate to the global feed (home).
   */
  onNavigateToGlobalFeed: () => void;
}

/**
 * React port of Angular HomeComponent.
 *
 * This is the main landing page that displays article feeds
 * (Global Feed, Your Feed, Tag Feed) with tag filtering.
 *
 * Angular source: src/app/features/article/pages/home/home.component.ts
 *
 * ## Angular → React mapping
 * - ngOnInit combineLatest subscription → useEffect watching props
 * - Angular signals → useState hooks
 * - DestroyRef / takeUntilDestroyed → useEffect cleanup (automatic)
 * - ActivatedRoute params/queryParams → props (tag, feed, page)
 * - UserService.isAuthenticated → props.isAuthenticated
 * - TagsService.getAll() → props.tags / props.tagsLoaded
 * - Router.navigate → callback props (onPageChange, onNavigateToLogin, etc.)
 */
export const HomeComponent: React.FC<HomeComponentProps> = ({
  isAuthenticated,
  tag,
  feed,
  page = 1,
  tags,
  tagsLoaded,
  onPageChange,
  onNavigateToLogin,
  onNavigateToTag,
  onNavigateToFollowingFeed,
  onNavigateToGlobalFeed,
}) => {
  // Mirrors Angular signal: listConfig
  const [listConfig, setListConfig] = useState<ArticleListConfig>({
    type: "all",
    filters: {},
  });

  // Mirrors Angular signal: currentPage
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Mirrors Angular signal: isFollowingFeed
  const [isFollowingFeed, setIsFollowingFeed] = useState<boolean>(false);

  /**
   * Replaces ngOnInit combineLatest subscription.
   * Reacts to changes in isAuthenticated, tag, feed, and page props
   * (equivalent to watching route.params, route.queryParams, and userService.isAuthenticated).
   */
  useEffect(() => {
    // If feed=following but not authenticated, redirect to login
    if (feed === "following" && !isAuthenticated) {
      onNavigateToLogin();
      return;
    }

    let type: string;
    let filters: { tag?: string } = {};

    if (tag) {
      type = "all";
      filters = { tag };
    } else if (feed === "following") {
      type = "feed";
    } else {
      type = "all";
    }

    setCurrentPage(page);
    setListConfig({ type, filters });
    setIsFollowingFeed(type === "feed");
  }, [isAuthenticated, tag, feed, page, onNavigateToLogin]);

  /**
   * Mirrors Angular onPageChange method.
   * Preserves the feed query param if present, omits page param if page is 1.
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      onPageChange(newPage, feed);
    },
    [feed, onPageChange],
  );

  return (
    <div className="home-page">
      {/* Banner: shown only when NOT authenticated (mirrors *ifAuthenticated="false") */}
      {!isAuthenticated && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">
              <img
                src="assets/conduit-logo.svg"
                alt="Conduit"
                className="banner-logo"
              />
            </h1>
            <p>
              This is the{" "}
              <a href="https://github.com/realworld-apps/angular-realworld-example-app">
                Angular frontend
              </a>{" "}
              demo from the{" "}
              <a href="https://github.com/realworld-apps/realworld">
                Realworld
              </a>{" "}
              project.
              <br />
              This demo is connected to a demo backend that enforces session
              isolation.
            </p>
          </div>
        </div>
      )}

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {/* Your Feed tab: shown only when authenticated (mirrors *ifAuthenticated="true") */}
                {isAuthenticated && (
                  <li className="nav-item">
                    <a
                      className={`nav-link${listConfig.type === "feed" ? " active" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={onNavigateToFollowingFeed}
                    >
                      Your Feed
                    </a>
                  </li>
                )}

                {/* Global Feed tab */}
                <li className="nav-item">
                  <a
                    className={`nav-link${listConfig.type === "all" && !listConfig.filters.tag ? " active" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={onNavigateToGlobalFeed}
                  >
                    Global Feed
                  </a>
                </li>

                {/* Tag Feed tab: shown only when a tag filter is active (mirrors [hidden]) */}
                {listConfig.filters.tag && (
                  <li className="nav-item">
                    <a className="nav-link active">
                      <i className="ion-pound"></i> {listConfig.filters.tag}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/*
             * TODO: Replace with React version of ArticleListComponent.
             * The Angular version receives these inputs/outputs:
             *   [limit]="10"
             *   [config]="listConfig()"
             *   [currentPage]="currentPage()"
             *   [isFollowingFeed]="isFollowingFeed()"
             *   (pageChange)="onPageChange($event)"
             *
             * For now, render a placeholder div that documents the expected props.
             */}
            {/*
             * TODO: Replace this placeholder with a React ArticleListComponent.
             * Expected props for the React ArticleListComponent:
             *   limit={10}
             *   config={listConfig}
             *   currentPage={currentPage}
             *   isFollowingFeed={isFollowingFeed}
             *   onPageChange={handlePageChange}
             *
             * The Angular ArticleListComponent (article-list.component.ts) handles:
             *   - Fetching articles via ArticlesService.query()
             *   - Pagination rendering and page change events
             *   - Loading states and empty feed messages
             *
             * TODO: Migrate ArticlesService to a React hook (useArticles)
             * TODO: Migrate ArticlePreviewComponent to React
             */}
            <div
              data-component="ArticleList"
              data-limit={10}
              data-config={JSON.stringify(listConfig)}
              data-current-page={currentPage}
              data-is-following-feed={isFollowingFeed}
              data-on-page-change="handlePageChange"
            />
          </div>

          {/* Sidebar: Popular Tags (mirrors *rxLet="tags$; let tags") */}
          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {/* Mirrors @for (tag of tags; track tag) */}
                {tags.map((tagItem) => (
                  <a
                    key={tagItem}
                    className="tag-default tag-pill"
                    style={{ cursor: "pointer" }}
                    onClick={() => onNavigateToTag(tagItem)}
                  >
                    {tagItem}
                  </a>
                ))}
              </div>

              {/* Loading state (mirrors [hidden]="tagsLoaded()") */}
              {!tagsLoaded && <div>Loading tags...</div>}

              {/* Empty state (mirrors [hidden]="!tagsLoaded() || tags.length > 0") */}
              {tagsLoaded && tags.length === 0 && (
                <div>No tags are here... yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
