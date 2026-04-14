import { test, expect } from '@playwright/test';

test.describe('App Shell', () => {
  test('app-root renders and contains heading "Hello, angular-app"', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('app-root h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Hello, angular-app');
  });

  test('both angular-version test ids are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="angular-version"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="angular-version-directive"]')).toBeVisible();
  });

  test('no JavaScript console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    // Wait for the app to fully render
    await expect(page.locator('app-root h1')).toBeVisible({ timeout: 10000 });

    expect(errors).toEqual([]);
  });

  test('visual regression', async ({ page }) => {
    await page.goto('/');
    // Wait for the app to fully render
    await expect(page.locator('app-root h1')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveScreenshot();
  });
});
