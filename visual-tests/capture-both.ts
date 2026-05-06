import { chromium, Page, Route } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const SOURCE_URL = 'http://localhost:4200';
const REACT_URL = 'http://localhost:5173';
const SOURCE_DIR = path.join(__dirname, 'screenshots', 'source');
const REACT_DIR = path.join(__dirname, 'screenshots', 'react');

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
`;

const API_BASE = 'https://api.realworld.show/api';

// Mock data cache
const mockDataCache: Record<string, { status: number; headers: Record<string, string>; body: string }> = {};

interface ScreenshotTask {
  name: string;
  path: string;
  waitForSelector?: string;
}

async function waitForReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

async function captureScreenshot(page: Page, dir: string, name: string, viewport: keyof typeof VIEWPORTS) {
  const vp = VIEWPORTS[viewport];
  await page.setViewportSize(vp);
  await page.waitForTimeout(300);
  const filePath = path.join(dir, `${name}-${viewport}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Captured: ${name}-${viewport}.png`);
}

async function main() {
  // Phase 1: Capture source with real API and cache responses
  console.log('=== Phase 1: Capturing source app with API caching ===\n');

  const browser = await chromium.launch({ headless: true });
  const sourceContext = await browser.newContext();
  const sourcePage = await sourceContext.newPage();

  // Intercept API calls and cache responses
  await sourcePage.route(`${API_BASE}/**`, async (route: Route) => {
    const url = route.request().url();
    const cacheKey = `${route.request().method()}:${url}`;

    const response = await route.fetch();
    const body = await response.text();
    mockDataCache[cacheKey] = {
      status: response.status(),
      headers: Object.fromEntries(
        Object.entries(response.headers()).filter(([k]) => ['content-type'].includes(k.toLowerCase())),
      ),
      body,
    };

    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body,
    });
  });

  await sourcePage.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });

  // Discover article slug from source
  console.log('Discovering article slug from source...');
  await sourcePage.goto(`${SOURCE_URL}/`, { waitUntil: 'networkidle' });
  await sourcePage.waitForSelector('.article-preview', { timeout: 15000 }).catch(() => {});
  await waitForReady(sourcePage);

  const articleLink = await sourcePage.$('.preview-link');
  let articleSlug = '';
  if (articleLink) {
    const href = await articleLink.getAttribute('href');
    if (href) articleSlug = href.replace('/article/', '');
  }

  const authorLink = await sourcePage.$('.author');
  let username = '';
  if (authorLink) {
    const href = await authorLink.getAttribute('href');
    if (href) username = href.replace('/profile/', '');
  }

  const tagLink = await sourcePage.$('.tag-pill');
  let tag = '';
  if (tagLink) {
    tag = (await tagLink.textContent())?.trim() || '';
  }

  console.log(`Found article: ${articleSlug}, user: ${username}, tag: ${tag}`);

  const tasks: ScreenshotTask[] = [
    { name: 'home', path: '/', waitForSelector: '.article-preview' },
    { name: 'login', path: '/login', waitForSelector: '.auth-page' },
    { name: 'register', path: '/register', waitForSelector: '.auth-page' },
  ];

  if (tag) tasks.push({ name: 'tag', path: `/tag/${encodeURIComponent(tag)}`, waitForSelector: '.article-preview' });
  if (articleSlug) tasks.push({ name: 'article', path: `/article/${articleSlug}`, waitForSelector: '.article-page' });
  if (username) {
    tasks.push({ name: 'profile', path: `/profile/${username}`, waitForSelector: '.profile-page' });
    tasks.push({ name: 'profile-favorites', path: `/profile/${username}/favorites`, waitForSelector: '.profile-page' });
  }
  tasks.push({ name: 'editor', path: '/editor', waitForSelector: '.auth-page,.editor-page' });
  tasks.push({ name: 'settings', path: '/settings', waitForSelector: '.auth-page,.settings-page' });

  for (const task of tasks) {
    console.log(`\nCapturing source: ${task.name} (${task.path})`);
    await sourcePage.goto(`${SOURCE_URL}${task.path}`, { waitUntil: 'domcontentloaded' });
    await sourcePage.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });

    if (task.waitForSelector) {
      await sourcePage.waitForSelector(task.waitForSelector, { timeout: 10000 }).catch(() => {
        console.log(`  Warning: selector ${task.waitForSelector} not found for ${task.name}`);
      });
    }

    await waitForReady(sourcePage);
    for (const viewport of ['desktop', 'mobile'] as const) {
      await captureScreenshot(sourcePage, SOURCE_DIR, task.name, viewport);
    }
  }

  console.log(`\nCached ${Object.keys(mockDataCache).length} API responses.`);

  // Phase 2: Capture React app with cached API responses
  console.log('\n=== Phase 2: Capturing React app with cached API data ===\n');

  const reactContext = await browser.newContext();
  const reactPage = await reactContext.newPage();

  // Serve cached API responses to React app
  await reactPage.route(`${API_BASE}/**`, async (route: Route) => {
    const url = route.request().url();
    const cacheKey = `${route.request().method()}:${url}`;

    if (mockDataCache[cacheKey]) {
      const cached = mockDataCache[cacheKey];
      await route.fulfill({
        status: cached.status,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        body: cached.body,
      });
    } else {
      // Fall through to real API
      await route.continue();
    }
  });

  await reactPage.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });

  for (const task of tasks) {
    console.log(`\nCapturing react: ${task.name} (${task.path})`);
    await reactPage.goto(`${REACT_URL}${task.path}`, { waitUntil: 'domcontentloaded' });
    await reactPage.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });

    if (task.waitForSelector) {
      await reactPage.waitForSelector(task.waitForSelector, { timeout: 10000 }).catch(() => {
        console.log(`  Warning: selector ${task.waitForSelector} not found for ${task.name}`);
      });
    }

    await waitForReady(reactPage);
    for (const viewport of ['desktop', 'mobile'] as const) {
      await captureScreenshot(reactPage, REACT_DIR, task.name, viewport);
    }
  }

  await browser.close();
  console.log('\nDone! Both apps captured with deterministic API data.');
}

main().catch(console.error);
