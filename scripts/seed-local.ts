/**
 * Seeds a local RealWorld backend (default http://localhost:8080) with users,
 * follows, tagged articles (enough for pagination), comments and favorites.
 *
 * Usage: API_URL=http://localhost:8080 bun scripts/seed-local.ts
 */
const API_URL = process.env['API_URL'] ?? 'http://localhost:8080';
const PASSWORD = 'password123';
const USERS = ['jake', 'ana', 'sam'];
const TAGS = ['angular', 'spring', 'java', 'rxjs', 'testing'];
const ARTICLES_PER_USER = 9;

async function call<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

async function signIn(username: string): Promise<string> {
  const user = { username, email: `${username}@example.com`, password: PASSWORD };
  try {
    return (await call<{ user: { token: string } }>('POST', '/users', { user })).user.token;
  } catch {
    const { email, password } = user;
    return (await call<{ user: { token: string } }>('POST', '/users/login', { user: { email, password } })).user.token;
  }
}

async function main(): Promise<void> {
  const tokens: Record<string, string> = {};
  for (const username of USERS) {
    tokens[username] = await signIn(username);
  }

  const [jake, ana, sam] = USERS;
  await call('POST', `/profiles/${ana}/follow`, {}, tokens[jake]);
  await call('POST', `/profiles/${sam}/follow`, {}, tokens[jake]);
  await call('POST', `/profiles/${jake}/follow`, {}, tokens[ana]);

  const slugs: string[] = [];
  for (const [u, username] of USERS.entries()) {
    for (let i = 1; i <= ARTICLES_PER_USER; i++) {
      const article = {
        title: `${username} seed article ${i} ${Date.now()}`,
        description: `Seed article ${i} by ${username}`,
        body: `# Seed article ${i}\n\nWritten by **${username}** for local runs.`,
        tagList: [TAGS[(u + i) % TAGS.length], TAGS[(u + i + 1) % TAGS.length]],
      };
      const { article: created } = await call<{ article: { slug: string } }>(
        'POST',
        '/articles',
        { article },
        tokens[username],
      );
      slugs.push(created.slug);
    }
  }

  for (const [i, slug] of slugs.entries()) {
    const commenter = USERS[(i + 1) % USERS.length];
    await call('POST', `/articles/${slug}/comments`, { comment: { body: `Nice post (${i + 1})` } }, tokens[commenter]);
    if (i % 3 === 0) {
      await call('POST', `/articles/${slug}/favorite`, {}, tokens[commenter]);
    }
  }

  console.log(
    `Seeded ${API_URL}: users ${USERS.join(', ')} (password "${PASSWORD}"), ${slugs.length} articles, tags ${TAGS.join(', ')}`,
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
