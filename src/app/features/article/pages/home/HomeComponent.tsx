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

  return null;
};
