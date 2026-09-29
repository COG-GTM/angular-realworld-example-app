import { Page, Request, Response, expect } from '@playwright/test';

export interface ArticleData {
  title: string;
  description: string;
  body: string;
  tags?: string[];
}

export async function createArticle(page: Page, article: ArticleData) {
  await page.goto('/editor', { waitUntil: 'load' });

  await page.fill('input[name="title"]', article.title);
  await page.fill('input[name="description"]', article.description);
  await page.fill('textarea[name="body"]', article.body);

  if (article.tags && article.tags.length > 0) {
    for (const tag of article.tags) {
      await page.fill('input[placeholder="Enter tags"]', tag);
      await page.press('input[placeholder="Enter tags"]', 'Enter');
    }
  }

  // Start waiting for navigation before clicking to avoid race condition
  await Promise.all([page.waitForURL(/\/article\/.+/), page.click('button:has-text("Publish Article")')]);
}

export async function editArticle(page: Page, slug: string, updates: Partial<ArticleData>) {
  await page.goto(`/editor/${slug}`, { waitUntil: 'load' });

  // Wait for the API data to populate the form (not just for the input to exist)
  const titleInput = page.locator('input[name="title"]');
  await expect(titleInput).not.toHaveValue('', { timeout: 10000 });

  if (updates.title) {
    await page.fill('input[name="title"]', '');
    await page.fill('input[name="title"]', updates.title);
  }
  if (updates.description) {
    await page.fill('input[name="description"]', '');
    await page.fill('input[name="description"]', updates.description);
  }
  if (updates.body) {
    await page.fill('textarea[name="body"]', '');
    await page.fill('textarea[name="body"]', updates.body);
  }

  await Promise.all([page.waitForURL(/\/article\/.+/), page.click('button:has-text("Publish Article")')]);
}

export async function deleteArticle(page: Page) {
  // Assumes we're already on the article page
  await Promise.all([page.waitForURL('/'), page.click('button:has-text("Delete Article")')]);
}

export async function favoriteArticle(page: Page) {
  await page.click('button.btn-outline-primary:has-text("Favorite")');
  // Wait for the button to update to "Unfavorite"
  await page.waitForSelector('button.btn-primary:has-text("Unfavorite")');
}

export async function unfavoriteArticle(page: Page) {
  await page.click('button.btn-primary:has-text("Unfavorite")');
  // Wait for the button to update back to "Favorite"
  await page.waitForSelector('button.btn-outline-primary:has-text("Favorite")');
}

let uniqueCounter = 0;

/**
 * Returns an id that is unique across calls and workers without relying on
 * the clock advancing between calls.
 */
export function uniqueId(): string {
  uniqueCounter += 1;
  return `${Date.now().toString(36)}${uniqueCounter}${Math.random().toString(36).slice(2, 8)}`;
}

export function generateUniqueArticle(): ArticleData {
  const id = uniqueId();
  return {
    title: `Test Article ${id}`,
    description: `Description for test article ${id}`,
    body: `This is the body content for test article ${id}. It contains enough text to be meaningful.`,
    tags: ['test', 'playwright'],
  };
}

export const editor = {
  title: (page: Page) => page.locator('input[name="title"]'),
  description: (page: Page) => page.locator('input[name="description"]'),
  body: (page: Page) => page.locator('textarea[name="body"]'),
  tagInput: (page: Page) => page.locator('input[placeholder="Enter tags"]'),
  tags: (page: Page) => page.locator('.editor-page .tag-list .tag-default'),
  publishButton: (page: Page) => page.getByRole('button', { name: 'Publish Article' }),
  errors: (page: Page) => page.locator('.error-messages li'),
};

/**
 * Fills the editor form. Fields that are `undefined` are left untouched;
 * empty strings clear the field.
 */
export async function fillArticleForm(page: Page, article: Partial<ArticleData>) {
  if (article.title !== undefined) await editor.title(page).fill(article.title);
  if (article.description !== undefined) await editor.description(page).fill(article.description);
  if (article.body !== undefined) await editor.body(page).fill(article.body);
  for (const tag of article.tags ?? []) {
    await editor.tagInput(page).fill(tag);
    await editor.tagInput(page).press('Enter');
    await expect(editor.tags(page).filter({ hasText: tag })).toHaveCount(1);
  }
}

const ARTICLE_WRITE_URL = /\/api\/articles(\/[^/?]+)?\/?(\?.*)?$/;

function isArticleWrite(method: 'POST' | 'PUT' | 'DELETE') {
  return (request: Request) => request.method() === method && ARTICLE_WRITE_URL.test(request.url());
}

/**
 * Resolves with the final (non-redirect) response of the next article write
 * request with the given method.
 */
export function waitForArticleResponse(page: Page, method: 'POST' | 'PUT' | 'DELETE'): Promise<Response> {
  return page.waitForResponse(
    response => isArticleWrite(method)(response.request()) && ![301, 302, 307, 308].includes(response.status()),
  );
}

/**
 * Clicks "Publish Article" and resolves with the API response for the save.
 */
export async function publishArticle(page: Page, method: 'POST' | 'PUT' = 'POST'): Promise<Response> {
  const [response] = await Promise.all([waitForArticleResponse(page, method), editor.publishButton(page).click()]);
  return response;
}

/**
 * Holds matching article write requests until `release()` is called, so tests
 * can assert on in-flight UI state without timing assumptions.
 */
export async function holdArticleRequests(page: Page, method: 'POST' | 'PUT' | 'DELETE') {
  let release!: () => void;
  const released = new Promise<void>(resolve => (release = resolve));
  const held: Request[] = [];
  await page.route(ARTICLE_WRITE_URL, async route => {
    if (!isArticleWrite(method)(route.request())) return route.fallback();
    held.push(route.request());
    await released;
    await route.fallback();
  });
  return { release, held };
}
