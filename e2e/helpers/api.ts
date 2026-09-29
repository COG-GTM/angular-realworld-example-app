import { APIRequestContext, expect } from '@playwright/test';

const API_BASE = 'https://api.realworld.show/api';

export interface UserCredentials {
  email: string;
  password: string;
  username: string;
}

export async function registerUserViaAPI(request: APIRequestContext, user: UserCredentials): Promise<string> {
  const response = await request.post(`${API_BASE}/users`, {
    data: {
      user: {
        username: user.username,
        email: user.email,
        password: user.password,
      },
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to register user: ${response.status()}`);
  }
  const data = await response.json();
  return data.user.token;
}

export async function loginUserViaAPI(request: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await request.post(`${API_BASE}/users/login`, {
    data: {
      user: {
        email,
        password,
      },
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to login: ${response.status()}`);
  }
  const data = await response.json();
  return data.user.token;
}

export async function createArticleViaAPI(
  request: APIRequestContext,
  token: string,
  article: { title: string; description: string; body: string; tagList?: string[] },
): Promise<string> {
  const response = await request.post(`${API_BASE}/articles`, {
    headers: {
      Authorization: `Token ${token}`,
    },
    data: {
      article: {
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tagList || [],
      },
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create article: ${response.status()}`);
  }
  const data = await response.json();
  return data.article.slug;
}

export async function updateUserViaAPI(
  request: APIRequestContext,
  token: string,
  updates: { image?: string; bio?: string; username?: string; email?: string },
): Promise<void> {
  const response = await request.put(`${API_BASE}/user`, {
    headers: {
      Authorization: `Token ${token}`,
    },
    data: {
      user: updates,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to update user: ${response.status()}`);
  }
}

export async function createManyArticles(
  request: APIRequestContext,
  token: string,
  count: number,
  tag: string = 'paginationtest',
): Promise<string[]> {
  const slugs: string[] = [];
  const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
  for (let i = 0; i < count; i++) {
    const slug = await createArticleViaAPI(request, token, {
      title: `Test Article ${uniqueId} Number ${i}`,
      description: `Description for test article ${i}`,
      body: `Body content for test article ${i}. Created with ID ${uniqueId}.`,
      tagList: [tag],
    });
    slugs.push(slug);
    // Small pause between articles to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return slugs;
}

export async function getCurrentUsernameViaAPI(request: APIRequestContext, token: string): Promise<string | null> {
  const response = await request.get(`${API_BASE}/user`, { headers: { Authorization: `Token ${token}` } });
  if (!response.ok()) return null;
  const data = await response.json();
  return data.user.username;
}

/**
 * Registers a user and returns a token that is confirmed to belong to them.
 *
 * The shared demo API can hand out the same token to requests issued within
 * the same second (the latest one wins), so a token is only returned once
 * GET /user resolves it to the expected username.
 */
export async function registerVerifiedUserViaAPI(request: APIRequestContext, user: UserCredentials): Promise<string> {
  let token = await registerUserViaAPI(request, user);
  await expect(async () => {
    if ((await getCurrentUsernameViaAPI(request, token)) !== user.username) {
      token = await loginUserViaAPI(request, user.email, user.password);
    }
    expect(await getCurrentUsernameViaAPI(request, token)).toBe(user.username);
  }).toPass({ intervals: [250, 500, 1000], timeout: 10_000 });
  return token;
}

export async function getArticleViaAPI(request: APIRequestContext, slug: string, token?: string) {
  return request.get(`${API_BASE}/articles/${slug}`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });
}

export async function getArticleStatusViaAPI(
  request: APIRequestContext,
  slug: string,
  token?: string,
): Promise<number> {
  return (await getArticleViaAPI(request, slug, token)).status();
}
