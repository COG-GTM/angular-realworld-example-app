import { describe, expect, it } from 'vitest';
import * as tags from './tags';
import { fakeResponse, mockFetch } from '../test/fetchMock';

const BASE = 'https://api.realworld.show/api';

describe('tags api', () => {
  it('fetches and unwraps the tag list', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(fakeResponse({ body: { tags: ['a', 'b'] } })));
    await expect(tags.getAll()).resolves.toEqual(['a', 'b']);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/tags`);
  });
});
