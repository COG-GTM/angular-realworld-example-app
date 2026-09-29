import { test, expect, Page, Route } from '@playwright/test';
import { register, generateUniqueUser } from './helpers/auth';

/**
 * Holds matching requests until `release` is called, then fails them with a 500.
 * Lets tests observe the optimistic UI state while the request is in flight.
 */
async function holdThenFail(page: Page, url: string | RegExp, method: string) {
  let release!: () => void;
  const released = new Promise<void>(resolve => (release = resolve));
  await page.route(url, async (route: Route) => {
    if (route.request().method() !== method) {
      return route.continue();
    }
    await released;
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ errors: { body: ['Internal server error'] } }),
    });
  });
  return release;
}

test.describe('Optimistic updates', () => {
  test.afterEach(async ({ context }) => {
    await context.close();
  });

  test('favorite updates before the server responds and rolls back on failure', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForSelector('.article-preview', { timeout: 10000 });
    await page.click('.article-preview h1');
    await page.waitForURL(/\/article\/.+/);

    const favoriteButton = page.locator('.banner app-favorite-button button');
    await expect(favoriteButton).toHaveText(/Favorite Article/);
    const initialText = (await favoriteButton.textContent())!.trim();
    const initialCount = Number(initialText.match(/\((\d+)\)/)![1]);

    const release = await holdThenFail(page, /\/api\/articles\/[^/]+\/favorite$/, 'POST');
    await favoriteButton.click();

    await expect(favoriteButton).toHaveText(new RegExp(`Unfavorite Article\\s*\\(${initialCount + 1}\\)`));
    await expect(favoriteButton).toHaveClass(/btn-primary/);

    release();

    await expect(favoriteButton).toHaveText(new RegExp(`^\\s*Favorite Article\\s*\\(${initialCount}\\)`));
    await expect(favoriteButton).toHaveClass(/btn-outline-primary/);
  });

  test('follow updates before the server responds and rolls back on failure', async ({ page }) => {
    const user = generateUniqueUser();
    await register(page, user.username, user.email, user.password);

    await page.goto('/profile/johndoe', { waitUntil: 'load' });
    const followButton = page.locator('.user-info app-follow-button button');
    await expect(followButton).toHaveText(/^\s*Follow johndoe/);

    const release = await holdThenFail(page, '**/api/profiles/johndoe/follow', 'POST');
    await followButton.click();

    await expect(followButton).toHaveText(/Unfollow johndoe/);

    release();

    await expect(followButton).toHaveText(/^\s*Follow johndoe/);
    await expect(followButton).toHaveClass(/btn-outline-secondary/);
  });
});
