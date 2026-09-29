import { test as base, expect, type Page } from '@playwright/test';
import { signInWithToken } from './helpers/auth';
import { getCurrentUser } from './helpers/debug';
import {
  createArticleViaAPI,
  getArticleStatusViaAPI,
  getArticleViaAPI,
  registerVerifiedUserViaAPI,
} from './helpers/api';
import {
  type ArticleData,
  editor,
  fillArticleForm,
  generateUniqueArticle,
  holdArticleRequests,
  publishArticle,
  uniqueId,
  waitForArticleResponse,
} from './helpers/articles';

/**
 * Article create / edit / delete flows, including validation failures.
 *
 * These specs avoid fixed sleeps: they synchronise on API responses
 * (`waitForResponse`), URL changes and web-first assertions, and use
 * `holdArticleRequests` to freeze a request in flight when asserting on
 * pending UI state.
 *
 * Notes on the demo backend (api.realworld.show):
 * - articles are only visible to their author, so cross-user scenarios mock
 *   the article fetch;
 * - tags are returned sorted, so tag lists are compared order-independently
 *   once they have round-tripped through the API.
 */

interface Author {
  username: string;
  token: string;
}

const test = base.extend<{ author: Author }>({
  // Auto fixture: every test starts signed in as a freshly registered author.
  author: [
    async ({ page, request }, use) => {
      let author!: Author;
      // Retry with a fresh account if the shared demo API hands our token to
      // a concurrent registration before the app has picked it up.
      await expect(async () => {
        const id = uniqueId();
        const user = { username: `author${id}`, email: `author${id}@example.com`, password: 'password123' };
        const token = await registerVerifiedUserViaAPI(request, user);
        await signInWithToken(page, token);
        expect((await getCurrentUser(page))?.username).toBe(user.username);
        author = { username: user.username, token };
      }).toPass({ intervals: [500, 1000], timeout: 20_000 });
      await use(author);
    },
    { auto: true },
  ],
});

const API_ARTICLES = 'https://api.realworld.show/api/articles';

/** Short random suffix; the API rejects tags of 20 characters or more. */
const tagId = () => Math.random().toString(36).slice(2, 8);

async function openNewEditor(page: Page) {
  await page.goto('/editor', { waitUntil: 'load' });
  await expect(editor.publishButton(page)).toBeEnabled();
}

async function openExistingEditor(page: Page, slug: string, expectedTitle: string) {
  await page.goto(`/editor/${slug}`, { waitUntil: 'load' });
  // The form is populated asynchronously from GET /articles/:slug.
  await expect(editor.title(page)).toHaveValue(expectedTitle);
}

const sorted = (tags: string[] = []) => [...tags].sort();

async function expectArticlePage(page: Page, slug: string, article: ArticleData) {
  await expect(page).toHaveURL(`/article/${slug}`);
  await expect(page.locator('.banner h1')).toHaveText(article.title);
  await expect(page.locator('.article-content')).toContainText(article.body.split('\n')[0].replace(/[#*]/g, '').trim());
  const tagList = page.locator('.article-content .tag-list .tag-default');
  await expect(tagList).toHaveText(sorted(article.tags));
}

test.describe('Article editor - create', () => {
  test('publishes a new article with markdown body and tags', async ({ page, author }) => {
    const id = uniqueId();
    const article: ArticleData = {
      title: `Create ${id}`,
      description: `Description ${id}`,
      body: `## Heading ${id}\n\nSome **bold** text.`,
      tags: [`alpha${tagId()}`, `beta${tagId()}`],
    };

    await openNewEditor(page);
    await fillArticleForm(page, article);
    const response = await publishArticle(page, 'POST');

    expect(response.status()).toBe(201);
    expect(response.request().postDataJSON()).toEqual({
      article: {
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tags,
      },
    });
    const { article: saved } = await response.json();
    expect(saved.author.username).toBe(author.username);

    await expectArticlePage(page, saved.slug, article);
    await expect(page.locator('.article-content h2')).toHaveText(`Heading ${id}`);
    await expect(page.locator('.article-content strong')).toHaveText('bold');
    await expect(page.getByRole('link', { name: 'Edit Article' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete Article' }).first()).toBeVisible();

    await page.goto(`/profile/${author.username}`, { waitUntil: 'load' });
    await expect(page.locator('.article-preview h1', { hasText: article.title })).toBeVisible();
  });

  test('manages tags in the editor before publishing', async ({ page }) => {
    const id = tagId();
    const [keep, remove, pending] = [`keep${id}`, `remove${id}`, `pending${id}`];

    await openNewEditor(page);
    await fillArticleForm(page, { ...generateUniqueArticle(), tags: [keep, remove] });

    // Duplicates and blank tags are ignored.
    await editor.tagInput(page).fill(keep);
    await editor.tagInput(page).press('Enter');
    await editor.tagInput(page).fill('   ');
    await editor.tagInput(page).press('Enter');
    await expect(editor.tags(page)).toHaveText([keep, remove]);
    await expect(editor.tagInput(page)).toHaveValue('');

    await editor.tags(page).filter({ hasText: remove }).locator('.ion-close-round').click();
    await expect(editor.tags(page)).toHaveText([keep]);

    // A tag still sitting in the input is included on publish.
    await editor.tagInput(page).fill(pending);
    const response = await publishArticle(page, 'POST');

    expect(response.ok()).toBe(true);
    expect(response.request().postDataJSON().article.tagList).toEqual([keep, pending]);
    await expect(page.locator('.article-content .tag-list .tag-default')).toHaveText([keep, pending]);
  });

  test('disables the form while saving and sends a single request', async ({ page }) => {
    const article = generateUniqueArticle();
    await openNewEditor(page);
    await fillArticleForm(page, article);

    const gate = await holdArticleRequests(page, 'POST');
    await editor.publishButton(page).click();

    await expect(editor.publishButton(page)).toBeDisabled();
    await expect(editor.title(page)).toBeDisabled();
    // A second click on the disabled button must not trigger another save.
    await editor.publishButton(page).click({ force: true });
    expect(gate.held).toHaveLength(1);

    const responsePromise = waitForArticleResponse(page, 'POST');
    gate.release();
    const response = await responsePromise;
    const { article: saved } = await response.json();

    await expectArticlePage(page, saved.slug, article);
    expect(gate.held).toHaveLength(1);
  });
});

test.describe('Article editor - create validation', () => {
  const fields = ['title', 'description', 'body'] as const;

  for (const field of fields) {
    test(`shows a server error and keeps the draft when ${field} is blank`, async ({ page }) => {
      const article = { ...generateUniqueArticle(), [field]: '' };

      await openNewEditor(page);
      await fillArticleForm(page, article);
      const response = await publishArticle(page, 'POST');

      expect(response.status()).toBe(422);
      await expect(editor.errors(page)).toHaveText([`${field} can't be blank`]);
      await expect(page).toHaveURL('/editor');

      // The draft is preserved and the form is usable again.
      await expect(editor.title(page)).toHaveValue(article.title);
      await expect(editor.description(page)).toHaveValue(article.description);
      await expect(editor.body(page)).toHaveValue(article.body);
      await expect(editor.tags(page)).toHaveText(article.tags ?? []);
      await expect(editor.publishButton(page)).toBeEnabled();
    });
  }

  test('lists every error when all required fields are blank', async ({ page }) => {
    await openNewEditor(page);
    const response = await publishArticle(page, 'POST');

    expect(response.status()).toBe(422);
    await expect(editor.errors(page)).toHaveText([
      "title can't be blank",
      "description can't be blank",
      "body can't be blank",
    ]);
    await expect(page).toHaveURL('/editor');
  });

  test('rejects tags that are too long', async ({ page }) => {
    const article = { ...generateUniqueArticle(), tags: ['x'.repeat(25)] };

    await openNewEditor(page);
    await fillArticleForm(page, article);
    const response = await publishArticle(page, 'POST');

    expect(response.status()).toBe(422);
    await expect(editor.errors(page)).toHaveCount(1);
    await expect(editor.errors(page).first()).toContainText('tagList');
    await expect(page).toHaveURL('/editor');
    await expect(editor.tags(page)).toHaveText(article.tags);
  });

  test('recovers from a validation error and publishes once fixed', async ({ page }) => {
    const article = generateUniqueArticle();

    await openNewEditor(page);
    await fillArticleForm(page, { ...article, title: '' });
    expect((await publishArticle(page, 'POST')).status()).toBe(422);
    await expect(editor.errors(page)).toHaveText(["title can't be blank"]);

    await editor.title(page).fill(article.title);
    const response = await publishArticle(page, 'POST');

    expect(response.status()).toBe(201);
    const { article: saved } = await response.json();
    await expectArticlePage(page, saved.slug, article);
    await expect(page.locator('.error-messages li')).toHaveCount(0);
  });
});

test.describe('Article editor - edit', () => {
  let slug: string;
  let original: ArticleData;

  test.beforeEach(async ({ request, author }) => {
    original = generateUniqueArticle();
    slug = await createArticleViaAPI(request, author.token, { ...original, tagList: original.tags });
  });

  test('prefills the editor with the existing article', async ({ page }) => {
    await openExistingEditor(page, slug, original.title);

    await expect(editor.description(page)).toHaveValue(original.description);
    await expect(editor.body(page)).toHaveValue(original.body);
    await expect(editor.tags(page)).toHaveText(sorted(original.tags));
  });

  test('saves changes to every field and persists them', async ({ page }) => {
    const id = uniqueId();
    const addedTag = `added${tagId()}`;
    const [keptTag, removedTag] = sorted(original.tags);
    const updated: ArticleData = {
      title: `Edited ${id}`,
      description: `Edited description ${id}`,
      body: `Edited body ${id}`,
      tags: [keptTag, addedTag],
    };

    await openExistingEditor(page, slug, original.title);
    await fillArticleForm(page, { title: updated.title, description: updated.description, body: updated.body });
    await editor.tags(page).filter({ hasText: removedTag }).locator('.ion-close-round').click();
    await fillArticleForm(page, { tags: [addedTag] });

    const response = await publishArticle(page, 'PUT');

    expect(response.status()).toBe(200);
    expect(new URL(response.url()).pathname).toBe(`/api/articles/${slug}`);
    expect(response.request().postDataJSON().article).toMatchObject({
      title: updated.title,
      description: updated.description,
      body: updated.body,
      tagList: updated.tags,
    });
    const { article: saved } = await response.json();
    await expectArticlePage(page, saved.slug, updated);

    await page.reload({ waitUntil: 'load' });
    await expectArticlePage(page, saved.slug, updated);
  });

  test('opens the editor from the article page', async ({ page }) => {
    await page.goto(`/article/${slug}`, { waitUntil: 'load' });
    await page.getByRole('link', { name: 'Edit Article' }).first().click();

    await expect(page).toHaveURL(`/editor/${slug}`);
    await expect(editor.title(page)).toHaveValue(original.title);
  });

  test('redirects non-authors away from the editor', async ({ page, request, author }) => {
    // The demo API hides articles from non-authors, so serve the real article
    // payload to a second user to exercise the client-side ownership check.
    const articleResponse = await getArticleViaAPI(request, slug, author.token);
    expect(articleResponse.ok()).toBe(true);
    const articleJson = await articleResponse.json();

    const id = uniqueId();
    const otherToken = await registerVerifiedUserViaAPI(request, {
      username: `intruder${id}`,
      email: `intruder${id}@example.com`,
      password: 'password123',
    });
    await signInWithToken(page, otherToken);
    await page.route(`${API_ARTICLES}/${slug}`, route =>
      route.request().method() === 'GET' ? route.fulfill({ json: articleJson }) : route.abort(),
    );
    await page.route(`${API_ARTICLES}/${slug}/comments`, route => route.fulfill({ json: { comments: [] } }));

    await page.goto(`/editor/${slug}`, { waitUntil: 'load' });

    await expect(page).toHaveURL('/');
    await page.goto(`/article/${slug}`, { waitUntil: 'load' });
    await expect(page.locator('.banner h1')).toHaveText(original.title);
    await expect(page.getByRole('link', { name: 'Edit Article' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete Article' })).toHaveCount(0);
  });

  test('shows validation errors from a rejected update and keeps the edits', async ({ page }) => {
    // The public demo API accepts blank fields on update, so the 422 contract
    // is simulated here to exercise the client's handling of it.
    await page.route(`${API_ARTICLES}/${slug}`, route =>
      route.request().method() === 'PUT'
        ? route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({ errors: { title: ["can't be blank"], body: ["can't be blank"] } }),
          })
        : route.fallback(),
    );

    await openExistingEditor(page, slug, original.title);
    await fillArticleForm(page, { title: '', body: '' });
    const response = await publishArticle(page, 'PUT');

    expect(response.status()).toBe(422);
    await expect(editor.errors(page)).toHaveText(["title can't be blank", "body can't be blank"]);
    await expect(page).toHaveURL(`/editor/${slug}`);
    await expect(editor.title(page)).toHaveValue('');
    await expect(editor.description(page)).toHaveValue(original.description);
    await expect(editor.publishButton(page)).toBeEnabled();

    // Once the server accepts the update the edit goes through.
    await page.unroute(`${API_ARTICLES}/${slug}`);
    const fixed = { ...original, title: `Fixed ${uniqueId()}`, body: 'Fixed body' };
    await fillArticleForm(page, { title: fixed.title, body: fixed.body });
    const retry = await publishArticle(page, 'PUT');

    expect(retry.status()).toBe(200);
    const { article: saved } = await retry.json();
    await expectArticlePage(page, saved.slug, fixed);
  });
});

test.describe('Article editor - delete', () => {
  let slug: string;
  let article: ArticleData;

  test.beforeEach(async ({ page, request, author }) => {
    article = generateUniqueArticle();
    slug = await createArticleViaAPI(request, author.token, { ...article, tagList: article.tags });
    await page.goto(`/article/${slug}`, { waitUntil: 'load' });
    await expect(page.locator('.banner h1')).toHaveText(article.title);
  });

  test('deletes the article and removes it everywhere', async ({ page, request, author }) => {
    const deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    const [response] = await Promise.all([waitForArticleResponse(page, 'DELETE'), deleteButton.click()]);

    expect(response.ok()).toBe(true);
    expect(new URL(response.url()).pathname).toBe(`/api/articles/${slug}`);
    await expect(page).toHaveURL('/');
    await expect.poll(() => getArticleStatusViaAPI(request, slug, author.token)).toBe(404);

    const authorArticles = page.waitForResponse(
      r => r.request().method() === 'GET' && r.url().includes(`/api/articles?`) && r.url().includes(author.username),
    );
    await page.goto(`/profile/${author.username}`, { waitUntil: 'load' });
    expect((await authorArticles).ok()).toBe(true);
    await expect(page.locator('.article-preview').first()).toBeVisible();
    await expect(page.locator('.article-preview h1', { hasText: article.title })).toHaveCount(0);

    await page.goto(`/article/${slug}`, { waitUntil: 'load' });
    await expect(page.locator('.banner h1', { hasText: article.title })).toHaveCount(0);
  });

  test('marks the delete button as busy while the request is in flight', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    const gate = await holdArticleRequests(page, 'DELETE');

    await deleteButton.click();
    await expect(deleteButton).toHaveClass(/disabled/);
    await expect(page).toHaveURL(`/article/${slug}`);

    gate.release();
    await expect(page).toHaveURL('/');
    expect(gate.held).toHaveLength(1);
  });

  test('keeps the article when the server rejects the delete', async ({ page, request, author }) => {
    await page.route(`${API_ARTICLES}/${slug}`, route =>
      route.request().method() === 'DELETE'
        ? route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ errors: { article: ['forbidden'] } }),
          })
        : route.fallback(),
    );

    const deleteButton = page.getByRole('button', { name: 'Delete Article' }).first();
    const [response] = await Promise.all([waitForArticleResponse(page, 'DELETE'), deleteButton.click()]);

    expect(response.status()).toBe(403);
    await expect(page).toHaveURL(`/article/${slug}`);
    await expect(page.locator('.banner h1')).toHaveText(article.title);
    expect(await getArticleStatusViaAPI(request, slug, author.token)).toBe(200);
  });
});
