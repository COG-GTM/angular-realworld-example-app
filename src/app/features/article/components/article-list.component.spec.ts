import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, NEVER } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { ArticleListComponent } from './article-list.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { ArticleListConfig } from '../models/article-list-config.model';
import { LoadingState } from '../../../core/models/loading-state.model';

describe('ArticleListComponent', () => {
  let component: ArticleListComponent;
  let fixture: ComponentFixture<ArticleListComponent>;
  let articlesService: any;

  const mockArticles = {
    articles: [
      {
        slug: 'test-1',
        title: 'Test 1',
        description: 'Desc 1',
        body: 'Body 1',
        tagList: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        favorited: false,
        favoritesCount: 0,
        author: { username: 'user1', bio: null, image: null, following: false },
      },
    ],
    articlesCount: 20,
  };

  const mockConfig: ArticleListConfig = {
    type: 'all',
    filters: {},
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    articlesService = {
      query: vi.fn().mockReturnValue(of(mockArticles)),
    };

    TestBed.configureTestingModule({
      imports: [ArticleListComponent, RouterTestingModule],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: new BehaviorSubject(false).asObservable(),
            currentUser: new BehaviorSubject(null).asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticleListComponent);
    component = fixture.componentInstance;
    component.limit = 10;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with NOT_LOADED state', () => {
    expect(component.loading()).toBe(LoadingState.NOT_LOADED);
  });

  it('should start with empty results', () => {
    expect(component.results()).toEqual([]);
  });

  it('should start with page 1', () => {
    expect(component.page()).toBe(1);
  });

  it('should run query when config changes', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
    });
    expect(articlesService.query).toHaveBeenCalled();
    expect(component.loading()).toBe(LoadingState.LOADED);
    expect(component.results().length).toBe(1);
  });

  it('should calculate total pages', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
    });
    expect(component.totalPages().length).toBe(2); // 20 / 10 = 2 pages
  });

  it('should set page on page change', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
    });
    const pageChangeSpy = vi.spyOn(component.pageChange, 'emit');
    component.setPageTo(2);
    expect(component.page()).toBe(2);
    expect(pageChangeSpy).toHaveBeenCalledWith(2);
  });

  it('should not re-query if setPageTo is called with current page', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
    });
    articlesService.query.mockClear();
    component.setPageTo(1); // already on page 1
    expect(articlesService.query).not.toHaveBeenCalled();
  });

  it('should set limit and offset in query filters', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
    });
    expect(articlesService.query).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ limit: 10, offset: 0 }),
      }),
    );
  });

  it('should handle page changes in ngOnChanges', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
    });
    articlesService.query.mockClear();
    component.ngOnChanges({
      currentPage: new SimpleChange(1, 2, false),
    });
    expect(component.page()).toBe(2);
    expect(articlesService.query).toHaveBeenCalled();
  });

  it('should reset page to 1 when config changes without page', () => {
    component.page.set(3);
    component.ngOnChanges({
      config: new SimpleChange(mockConfig, { ...mockConfig, type: 'feed' }, false),
    });
    expect(component.page()).toBe(1);
  });

  it('should not reset page when config and page change together', () => {
    component.ngOnChanges({
      config: new SimpleChange(null, mockConfig, true),
      currentPage: new SimpleChange(null, 3, true),
    });
    expect(component.page()).toBe(3);
  });

  it('should not run query if no config is set (query is falsy)', () => {
    // Line 96 branch: this.query is undefined, so runQuery should not be called
    articlesService.query.mockClear();
    component.ngOnChanges({
      currentPage: new SimpleChange(1, 2, false),
    });
    expect(articlesService.query).not.toHaveBeenCalled();
  });

  it('should run query without setting limit/offset when limit is 0', () => {
    // Line 116 branch: this.limit is falsy (0)
    // Use NEVER to prevent subscriber from executing (avoids division by zero in totalPages calc)
    component.limit = 0;
    articlesService.query.mockReturnValue(NEVER);
    const freshConfig = { type: 'all', filters: {} } as any;
    component.ngOnChanges({
      config: new SimpleChange(null, freshConfig, true),
    });
    expect(articlesService.query).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.not.objectContaining({ limit: expect.anything() }),
      }),
    );
  });
});
