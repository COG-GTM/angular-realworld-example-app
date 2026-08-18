import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Page, type Route } from 'playwright';
import { ARTICLE, ARTICLES, AUTHOR, COMMENTS, CURRENT_USER, CURRENT_USER_PROFILE, TAGS } from './fixtures';

export const API_PATTERN = 'https://api.realworld.show/api/**';
export const SOURCE_URL = process.env.SOURCE_URL ?? 'http://localhost:4200';
export const REACT_URL = process.env.REACT_URL ?? 'http://localhost:5173';
export const SCREENSHOT_ROOT = join(import.meta.dirname, 'screenshots');

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

export interface View {
  name: string;
  path: string;
  authenticated?: boolean;
  /** Extra interaction (e.g. paginate) executed after the page has settled. */
  action?: (page: Page) => Promise<void>;
  /** Selector that must be visible before the screenshot is taken. */
  waitFor?: string;
}

export const VIEWS: View[] = [
  { name: 'home-global', path: '/', waitFor: '.article-preview' },
  { name: 'home-tag', path: '/tag/dragons', waitFor: '.article-preview' },
  {
    name: 'home-pagination-page-2',
    path: '/',
    waitFor: '.pagination .page-link',
    action: async page => {
      await page
        .locator('.pagination .page-link')
        .filter({ hasText: /^\s*2\s*$/ })
        .first()
        .click();
      await page.waitForTimeout(500);
    },
  },
  { name: 'home-auth-global', path: '/', authenticated: true, waitFor: '.article-preview' },
  { name: 'home-auth-your-feed', path: '/?feed=following', authenticated: true, waitFor: '.article-preview' },
  { name: 'login', path: '/login', waitFor: '.auth-page' },
  { name: 'register', path: '/register', waitFor: '.auth-page' },
  { name: 'settings', path: '/settings', authenticated: true, waitFor: '.settings-page' },
  { name: 'profile-articles', path: `/profile/${AUTHOR.username}`, waitFor: '.profile-page' },
  { name: 'profile-favorites', path: `/profile/${AUTHOR.username}/favorites`, waitFor: '.profile-page' },
  {
    name: 'profile-own',
    path: `/profile/${CURRENT_USER.username}`,
    authenticated: true,
    waitFor: '.profile-page',
  },
  { name: 'editor-new', path: '/editor', authenticated: true, waitFor: '.editor-page' },
  { name: 'editor-edit', path: `/editor/${ARTICLE.slug}`, authenticated: true, waitFor: '.editor-page' },
  { name: 'article', path: `/article/${ARTICLE.slug}`, waitFor: '.article-page .banner' },
  {
    name: 'article-auth',
    path: `/article/${ARTICLE.slug}`,
    authenticated: true,
    waitFor: '.article-page .comment-form',
  },
];

interface JsonBody {
  [key: string]: unknown;
}

function articlesResponse(url: URL, feed: boolean): JsonBody {
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const tag = url.searchParams.get('tag');
  const author = url.searchParams.get('author');
  const favorited = url.searchParams.get('favorited');

  let pool = ARTICLES;
  if (feed) pool = ARTICLES.slice(0, 12);
  if (tag) pool = ARTICLES.filter(article => article.tagList.includes(tag));
  if (author) pool = ARTICLES.filter(article => article.author.username === author);
  if (favorited) pool = ARTICLES.filter(article => article.favorited);

  return {
    articles: pool.slice(offset, offset + limit),
    articlesCount: pool.length,
  };
}

async function fulfillApi(route: Route): Promise<void> {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname.replace(/^\/api/, '');
  const json = (body: JsonBody) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

  if (path === '/user') return json({ user: CURRENT_USER });
  if (path === '/tags') return json({ tags: TAGS });
  if (path === '/articles/feed') return json(articlesResponse(url, true));
  if (path === '/articles') return json(articlesResponse(url, false));

  if (/^\/articles\/[^/]+\/comments$/.test(path)) return json({ comments: COMMENTS });

  const articleMatch = path.match(/^\/articles\/([^/]+)$/);
  if (articleMatch) {
    const article = ARTICLES.find(item => item.slug === articleMatch[1]) ?? ARTICLE;
    return json({ article });
  }

  const profileMatch = path.match(/^\/profiles\/([^/]+)$/);
  if (profileMatch) {
    const profile = profileMatch[1] === CURRENT_USER.username ? CURRENT_USER_PROFILE : AUTHOR;
    return json({ profile });
  }

  return json({});
}

const STABILISE_CSS = `*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }`;

export interface CaptureOptions {
  baseUrl: string;
  outDir: string;
}

export async function capture({ baseUrl, outDir }: CaptureOptions): Promise<string[]> {
  mkdirSync(outDir, { recursive: true });
  const browser: Browser = await chromium.launch();
  const written: string[] = [];

  try {
    for (const view of VIEWS) {
      for (const viewportName of Object.keys(VIEWPORTS) as ViewportName[]) {
        const context = await browser.newContext({
          viewport: VIEWPORTS[viewportName],
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
        });
        await context.route(API_PATTERN, fulfillApi);
        if (view.authenticated) {
          await context.addInitScript(token => {
            window.localStorage.setItem('jwtToken', token);
          }, CURRENT_USER.token);
        }

        const page = await context.newPage();
        await page.goto(`${baseUrl}${view.path}`, { waitUntil: 'domcontentloaded' });
        await page.addStyleTag({ content: STABILISE_CSS });
        if (view.waitFor) {
          await page.locator(view.waitFor).first().waitFor({ state: 'visible', timeout: 20_000 });
        }
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        if (view.action) {
          await view.action(page);
          await page.addStyleTag({ content: STABILISE_CSS });
          await page.waitForLoadState('networkidle');
        }
        await page.waitForTimeout(300);

        const file = join(outDir, `${view.name}-${viewportName}.png`);
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
        written.push(file);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  return written;
}
