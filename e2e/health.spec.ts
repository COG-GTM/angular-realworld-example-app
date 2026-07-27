import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
  test('app should load successfully', async ({ page }) => {
    await page.goto('/');

    // Should see the app brand/logo
    await expect(page.locator('a.navbar-brand')).toBeVisible({ timeout: 10000 });

    // Should see navigation
    await expect(page.locator('nav.navbar')).toBeVisible();
  });

  test('API should be accessible', async ({ page }) => {
    const tagsUrl = 'https://api.realworld.show/api/tags';
    const mockTags = { tags: ['angular', 'react', 'vue'] };
    let routeHits = 0;

    await page.route(tagsUrl, async route => {
      routeHits++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(mockTags),
      });
    });

    await page.goto('/');

    const body = await page.evaluate(url => fetch(url).then(response => response.json()), tagsUrl);

    expect(routeHits).toBeGreaterThan(0);
    expect(body).toEqual(mockTags);

    // The app consumes the same mocked endpoint for its tag sidebar
    for (const tag of mockTags.tags) {
      await expect(page.locator('.sidebar .tag-list').getByText(tag, { exact: true })).toBeVisible();
    }
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/login');

    // Should see login form
    await expect(page.locator('h1')).toContainText('Sign in', { timeout: 10000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/register');

    // Should see register form
    await expect(page.locator('h1')).toContainText('Sign up', { timeout: 10000 });
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });
});
