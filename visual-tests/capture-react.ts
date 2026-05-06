import { chromium, Page } from 'playwright';
import * as path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'react');

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

interface ScreenshotTask {
  name: string;
  url: string;
  waitForSelector?: string;
}

async function waitForReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

async function captureScreenshot(page: Page, name: string, viewport: keyof typeof VIEWPORTS) {
  const vp = VIEWPORTS[viewport];
  await page.setViewportSize(vp);
  await page.waitForTimeout(300);
  const filePath = path.join(SCREENSHOT_DIR, `${name}-${viewport}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Captured: ${name}-${viewport}.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });

  // Discover article slug, username, tag
  console.log('Discovering article slug...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.article-preview', { timeout: 15000 }).catch(() => {});
  await waitForReady(page);

  const articleLink = await page.$('.preview-link');
  let articleSlug = '';
  if (articleLink) {
    const href = await articleLink.getAttribute('href');
    if (href) articleSlug = href.replace('/article/', '');
  }

  const authorLink = await page.$('.author');
  let username = '';
  if (authorLink) {
    const href = await authorLink.getAttribute('href');
    if (href) username = href.replace('/profile/', '');
  }

  const tagLink = await page.$('.tag-pill');
  let tag = '';
  if (tagLink) {
    tag = (await tagLink.textContent())?.trim() || '';
  }

  console.log(`Found article: ${articleSlug}, user: ${username}, tag: ${tag}`);

  const tasks: ScreenshotTask[] = [
    { name: 'home', url: '/', waitForSelector: '.article-preview' },
    { name: 'login', url: '/login', waitForSelector: '.auth-page' },
    { name: 'register', url: '/register', waitForSelector: '.auth-page' },
  ];

  if (tag) tasks.push({ name: 'tag', url: `/tag/${encodeURIComponent(tag)}`, waitForSelector: '.article-preview' });
  if (articleSlug) tasks.push({ name: 'article', url: `/article/${articleSlug}`, waitForSelector: '.article-page' });
  if (username) {
    tasks.push({ name: 'profile', url: `/profile/${username}`, waitForSelector: '.profile-page' });
    tasks.push({ name: 'profile-favorites', url: `/profile/${username}/favorites`, waitForSelector: '.profile-page' });
  }
  tasks.push({ name: 'editor', url: '/editor', waitForSelector: '.auth-page,.editor-page' });
  tasks.push({ name: 'settings', url: '/settings', waitForSelector: '.auth-page,.settings-page' });

  for (const task of tasks) {
    console.log(`\nCapturing: ${task.name} (${task.url})`);
    await page.goto(`${BASE_URL}${task.url}`, { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });

    if (task.waitForSelector) {
      await page.waitForSelector(task.waitForSelector, { timeout: 10000 }).catch(() => {
        console.log(`  Warning: selector ${task.waitForSelector} not found for ${task.name}`);
      });
    }

    await waitForReady(page);

    for (const viewport of ['desktop', 'mobile'] as const) {
      await captureScreenshot(page, task.name, viewport);
    }
  }

  await browser.close();
  console.log('\nDone! All React screenshots captured.');
}

main().catch(console.error);
