import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { ArticlesService } from './articles.service';
import { Article } from '../models/article.model';
import { ArticleListConfig } from '../models/article-list-config.model';

describe('ArticlesService', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: ArticlesService;
  let httpMock: HttpTestingController;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body content',
    tagList: ['test', 'angular'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

  const mockArticleList: Article[] = [
    mockArticle,
    {
      ...mockArticle,
      slug: 'second-article',
      title: 'Second Article',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ArticlesService],
    });
    service = TestBed.inject(ArticlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('query', () => {
    it('should fetch articles with default config', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {},
      };
      service.query(config).subscribe(response => {
        expect(response.articles).toEqual(mockArticleList);
        expect(response.articlesCount).toBe(2);
      });
      const req = httpMock.expectOne('/articles');
      expect(req.request.method).toBe('GET');
      req.flush({ articles: mockArticleList, articlesCount: 2 });
    });

    it('should fetch feed articles when type is feed', () => {
      const config: ArticleListConfig = {
        type: 'feed',
        filters: {},
      };
      service.query(config).subscribe();
      const req = httpMock.expectOne('/articles/feed');
      expect(req.request.method).toBe('GET');
      req.flush({ articles: mockArticleList, articlesCount: 2 });
    });

    it('should include query parameters from filters', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {
          tag: 'angular',
          author: 'testuser',
          limit: 10,
          offset: 0,
        },
      };

      service.query(config).subscribe();

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/articles' &&
          request.params.get('tag') === 'angular' &&
          request.params.get('author') === 'testuser' &&
          request.params.get('limit') === '10' &&
          request.params.get('offset') === '0'
        );
      });

      expect(req.request.method).toBe('GET');
      req.flush({ articles: mockArticleList, articlesCount: 2 });
    });

    it('should handle pagination parameters', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {
          limit: 20,
          offset: 40,
        },
      };

      service.query(config).subscribe();

      const req = httpMock.expectOne(request => {
        return (
          request.url === '/articles' && request.params.get('limit') === '20' && request.params.get('offset') === '40'
        );
      });

      req.flush({ articles: mockArticleList, articlesCount: 100 });
    });

    it('should handle empty results', () => {
      const config: ArticleListConfig = {
        type: 'all',
        filters: {},
      };
      service.query(config).subscribe(response => {
        expect(response.articles).toEqual([]);
        expect(response.articlesCount).toBe(0);
      });
      const req = httpMock.expectOne('/articles');
      req.flush({ articles: [], articlesCount: 0 });
    });
  });

  describe('get', () => {
    it('should fetch single article by slug', async () => {
      const slug = 'test-article';
      const promise = firstValueFrom(service.get(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      expect(req.request.method).toBe('GET');
      req.flush({ article: mockArticle });
      const article = await promise;
      expect(article).toEqual(mockArticle);
    });

    it('should handle article not found', async () => {
      const slug = 'non-existent';
      const errorResponse = { status: 404, statusText: 'Not Found' };
      const promise = firstValueFrom(service.get(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      req.flush('Article not found', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('delete', () => {
    it('should delete article by slug', async () => {
      const slug = 'article-to-delete';
      const promise = firstValueFrom(service.delete(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
      expect(true).toBe(true);
    });

    it('should handle delete error', async () => {
      const slug = 'protected-article';
      const errorResponse = { status: 403, statusText: 'Forbidden' };
      const promise = firstValueFrom(service.delete(slug));
      const req = httpMock.expectOne(`/articles/${slug}`);
      req.flush('Cannot delete', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('create', () => {
    it('should create new article', async () => {
      const newArticle: Partial<Article> = {
        title: 'New Article',
        description: 'New description',
        body: 'New body',
        tagList: ['new', 'test'],
      };
      const promise = firstValueFrom(service.create(newArticle));
      const req = httpMock.expectOne('/articles/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ article: newArticle });
      req.flush({ article: { ...mockArticle, ...newArticle } });
      const article = await promise;
      expect(article.title).toBe(newArticle.title);
    });

    it('should handle validation errors', async () => {
      const invalidArticle: Partial<Article> = {
        title: '',
        description: '',
        body: '',
      };
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };
      const promise = firstValueFrom(service.create(invalidArticle));
      const req = httpMock.expectOne('/articles/');
      req.flush('Validation failed', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('update', () => {
    it('should update existing article', async () => {
      const updates: Partial<Article> = {
        slug: 'existing-article',
        title: 'Updated Title',
        description: 'Updated description',
      };
      const promise = firstValueFrom(service.update(updates));
      const req = httpMock.expectOne(`/articles/${updates.slug}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ article: updates });
      req.flush({ article: { ...mockArticle, ...updates } });
      const article = await promise;
      expect(article.title).toBe(updates.title);
    });
  });

  describe('favorite', () => {
    it('should favorite an article', async () => {
      const slug = 'article-to-favorite';
      const promise = firstValueFrom(service.favorite(slug));
      const req = httpMock.expectOne(`/articles/${slug}/favorite`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ article: { ...mockArticle, favorited: true } });
      const article = await promise;
      expect(article.favorited).toBe(true);
    });
  });

  describe('unfavorite', () => {
    it('should unfavorite an article', async () => {
      const slug = 'article-to-unfavorite';
      const promise = firstValueFrom(service.unfavorite(slug));
      const req = httpMock.expectOne(`/articles/${slug}/favorite`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
      expect(true).toBe(true);
    });
  });

  describe('request shape edge cases', () => {
    it('should send no query params when filters are empty', () => {
      service.query({ type: 'all', filters: {} }).subscribe();
      const req = httpMock.expectOne('/articles');
      expect(req.request.params.keys()).toEqual([]);
      req.flush({ articles: [], articlesCount: 0 });
    });

    it('should pass filters to the feed endpoint', () => {
      service.query({ type: 'feed', filters: { limit: 10, offset: 10 } }).subscribe();
      const req = httpMock.expectOne(
        r => r.url === '/articles/feed' && r.params.get('limit') === '10' && r.params.get('offset') === '10',
      );
      req.flush({ articles: [], articlesCount: 0 });
    });

    it('should send the favorited filter', () => {
      service.query({ type: 'all', filters: { favorited: 'testuser' } }).subscribe();
      const req = httpMock.expectOne(r => r.url === '/articles' && r.params.get('favorited') === 'testuser');
      req.flush({ articles: [], articlesCount: 0 });
    });

    it('should unwrap the article envelope on update, favorite and create', async () => {
      const updated = firstValueFrom(service.update({ slug: 'test-article', body: 'new' }));
      httpMock.expectOne('/articles/test-article').flush({ article: mockArticle });
      expect(await updated).toEqual(mockArticle);

      const favorited = firstValueFrom(service.favorite('test-article'));
      httpMock.expectOne('/articles/test-article/favorite').flush({ article: mockArticle });
      expect(await favorited).toEqual(mockArticle);

      const created = firstValueFrom(service.create({ title: 'Test Article' }));
      httpMock.expectOne('/articles/').flush({ article: mockArticle });
      expect(await created).toEqual(mockArticle);
    });
  });

  describe('error paths', () => {
    type Call = {
      name: string;
      call: () => Observable<unknown>;
      url: string;
      method: string;
    };

    const calls: Call[] = [
      { name: 'query (all)', call: () => service.query({ type: 'all', filters: {} }), url: '/articles', method: 'GET' },
      {
        name: 'query (feed)',
        call: () => service.query({ type: 'feed', filters: {} }),
        url: '/articles/feed',
        method: 'GET',
      },
      { name: 'get', call: () => service.get('test-article'), url: '/articles/test-article', method: 'GET' },
      { name: 'delete', call: () => service.delete('test-article'), url: '/articles/test-article', method: 'DELETE' },
      { name: 'create', call: () => service.create({ title: 'New' }), url: '/articles/', method: 'POST' },
      {
        name: 'update',
        call: () => service.update({ slug: 'test-article', title: 'New' }),
        url: '/articles/test-article',
        method: 'PUT',
      },
      {
        name: 'favorite',
        call: () => service.favorite('test-article'),
        url: '/articles/test-article/favorite',
        method: 'POST',
      },
      {
        name: 'unfavorite',
        call: () => service.unfavorite('test-article'),
        url: '/articles/test-article/favorite',
        method: 'DELETE',
      },
    ];

    const statuses: [number, string][] = [
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [500, 'Internal Server Error'],
    ];

    const cases = calls.flatMap(c => statuses.map(([status, statusText]) => ({ ...c, status, statusText })));

    it.each(cases)('$name should propagate a $status error', async ({ call, url, method, status, statusText }) => {
      const promise = firstValueFrom(call());
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe(method);
      req.flush({ errors: { body: [statusText] } }, { status, statusText });
      await expect(promise).rejects.toMatchObject({ status, statusText, error: { errors: { body: [statusText] } } });
    });

    it.each(calls)('$name should propagate a network error', async ({ call, url }) => {
      const promise = firstValueFrom(call());
      httpMock.expectOne(url).error(new ProgressEvent('error'));
      await expect(promise).rejects.toMatchObject({ status: 0 });
    });

    it('should surface 422 validation errors from update', async () => {
      const errors = { errors: { title: ["can't be blank"] } };
      const promise = firstValueFrom(service.update({ slug: 'test-article', title: '' }));
      httpMock.expectOne('/articles/test-article').flush(errors, { status: 422, statusText: 'Unprocessable Entity' });
      await expect(promise).rejects.toMatchObject({ status: 422, error: errors });
    });

    it('should not emit a value when a request fails', async () => {
      const next = vi.fn();
      const error = vi.fn();
      service.get('missing').subscribe({ next, error });
      httpMock.expectOne('/articles/missing').flush('Not found', { status: 404, statusText: 'Not Found' });
      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
    });
  });
});
