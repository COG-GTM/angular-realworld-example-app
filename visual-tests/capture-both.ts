import { chromium, Page, Route } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { mockUser, mockProfile, mockTags, mockArticles, mockArticle, mockComments } from './mock-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_ROOT = 'https://api.realworld.show/api';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

interface CaptureConfig {
  name: string;
  baseUrl: string;
  outputDir: string;
}

const routes = [
  { name: 'home-global', path: '/', auth: false },
  { name: 'home-your-feed', path: '/?feed=your', auth: true },
  { name: 'tag-feed', path: '/tag/programming', auth: false },
  { name: 'login', path: '/login', auth: false },
  { name: 'register', path: '/register', auth: false },
  { name: 'settings', path: '/settings', auth: true },
  { name: 'editor', path: '/editor', auth: true },
  { name: 'article-detail', path: '/article/how-to-build-webapps-that-scale', auth: false },
  { name: 'profile', path: '/profile/testuser', auth: false },
  { name: 'profile-favorites', path: '/profile/testuser/favorites', auth: false },
];

async function setupMockApi(page: Page, authenticated: boolean) {
  await page.route(`${API_ROOT}/**`, async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/user') && !url.includes('/users')) {
      if (authenticated) {
        await route.fulfill({ json: mockUser });
      } else {
        await route.fulfill({ status: 401, json: { errors: { token: ['is invalid'] } } });
      }
      return;
    }

    if (url.includes('/users/login') || (url.includes('/users') && method === 'POST')) {
      await route.fulfill({ json: mockUser });
      return;
    }

    if (url.includes('/tags')) {
      await route.fulfill({ json: mockTags });
      return;
    }

    if (url.includes('/articles/') && url.includes('/comments')) {
      await route.fulfill({ json: mockComments });
      return;
    }

    if (url.match(/\/articles\/[^/]+$/) && !url.includes('?')) {
      await route.fulfill({ json: mockArticle });
      return;
    }

    if (url.includes('/articles')) {
      await route.fulfill({ json: mockArticles });
      return;
    }

    if (url.includes('/profiles/')) {
      await route.fulfill({ json: mockProfile });
      return;
    }

    await route.fulfill({ json: {} });
  });
}

async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

async function captureApp(config: CaptureConfig) {
  const browser = await chromium.launch({ headless: true });

  fs.mkdirSync(config.outputDir, { recursive: true });

  for (const viewport of Object.entries(VIEWPORTS)) {
    const [viewportName, viewportSize] = viewport;

    for (const route of routes) {
      const context = await browser.newContext({
        viewport: viewportSize,
        storageState: route.auth
          ? {
              cookies: [],
              origins: [
                {
                  origin: config.baseUrl,
                  localStorage: [{ name: 'jwtToken', value: 'mock-jwt-token' }],
                },
              ],
            }
          : undefined,
      });
      const page = await context.newPage();

      await setupMockApi(page, route.auth);

      const url = `${config.baseUrl}${route.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      } catch {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(2000);
        } catch {
          console.error(`Failed to load ${url}`);
          await context.close();
          continue;
        }
      }

      await page.waitForTimeout(500);
      await disableAnimations(page);
      await page.waitForTimeout(200);

      const filename = `${route.name}-${viewportName}.png`;
      const filepath = path.join(config.outputDir, filename);

      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`  ✓ ${filename}`);

      await context.close();
    }
  }

  await browser.close();
}

async function main() {
  const target = process.argv[2] || 'both';
  const sourcePort = process.argv[3] || '4200';
  const reactPort = process.argv[4] || '4201';

  const screenshotsDir = path.join(__dirname, 'screenshots');

  if (target === 'source' || target === 'both') {
    console.log('\n📸 Capturing Angular (source) screenshots...');
    await captureApp({
      name: 'source',
      baseUrl: `http://localhost:${sourcePort}`,
      outputDir: path.join(screenshotsDir, 'source'),
    });
  }

  if (target === 'react' || target === 'both') {
    console.log('\n📸 Capturing React screenshots...');
    await captureApp({
      name: 'react',
      baseUrl: `http://localhost:${reactPort}`,
      outputDir: path.join(screenshotsDir, 'react'),
    });
  }

  console.log('\n✅ Screenshot capture complete!');
}

main().catch(console.error);
