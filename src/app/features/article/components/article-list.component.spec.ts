import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ArticleListComponent } from './article-list.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { BehaviorSubject, of } from 'rxjs';
import { Article } from '../models/article.model';
import { ArticleListConfig } from '../models/article-list-config.model';
import { LoadingState } from '../../../core/models/loading-state.model';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { By } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ArticleListComponent', () => {
  let component: ArticleListComponent;
  let fixture: ComponentFixture<ArticleListComponent>;
  let mockArticlesService: { query: ReturnType<typeof vi.fn> };

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test desc',
    body: 'Test body',
    tagList: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    author: {
      username: 'testuser',
      bio: null,
      image: null,
      following: false,
    },
  };

  const mockConfig: ArticleListConfig = {
    type: 'all',
    filters: {},
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    mockArticlesService = {
      query: vi.fn().mockReturnValue(of({ articles: [mockArticle], articlesCount: 1 })),
    };

    TestBed.configureTestingModule({
      imports: [ArticleListComponent, RouterTestingModule],
      providers: [
        { provide: ArticlesService, useValue: mockArticlesService },
        {
          provide: UserService,
          useValue: {
            currentUser: new BehaviorSubject(null).asObservable().pipe(distinctUntilChanged()),
            isAuthenticated: new BehaviorSubject(false).asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticleListComponent);
    component = fixture.componentInstance;
    component.limit = 10;
    component.config = { ...mockConfig };
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should start with NOT_LOADED loading state', () => {
    expect(component.loading()).toBe(LoadingState.NOT_LOADED);
  });

  it('should query articles on config change', () => {
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
    };
    component.ngOnChanges(changes);
    expect(mockArticlesService.query).toHaveBeenCalled();
  });

  it('should set results after query', () => {
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
    };
    component.ngOnChanges(changes);
    expect(component.results()).toEqual([mockArticle]);
    expect(component.loading()).toBe(LoadingState.LOADED);
  });

  it('should reset page to 1 on config change without page change', () => {
    component.page.set(3);
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
    };
    component.ngOnChanges(changes);
    expect(component.page()).toBe(1);
  });

  it('should not reset page when currentPage is also provided', () => {
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
      currentPage: new SimpleChange(null, 3, true),
    };
    component.ngOnChanges(changes);
    expect(component.page()).toBe(3);
  });

  it('should calculate totalPages correctly', () => {
    mockArticlesService.query.mockReturnValue(of({ articles: [], articlesCount: 25 }));
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
    };
    component.ngOnChanges(changes);
    expect(component.totalPages()).toEqual([1, 2, 3]);
  });

  it('should emit pageChange when setPageTo is called with different page', () => {
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
    };
    component.ngOnChanges(changes);

    const emitSpy = vi.fn();
    component.pageChange.subscribe(emitSpy);
    component.setPageTo(2);
    expect(emitSpy).toHaveBeenCalledWith(2);
    expect(component.page()).toBe(2);
  });

  it('should not emit pageChange when setPageTo is called with same page', () => {
    const emitSpy = vi.fn();
    component.pageChange.subscribe(emitSpy);
    component.setPageTo(1);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should set offset based on page and limit', () => {
    const changes: SimpleChanges = {
      config: new SimpleChange(null, mockConfig, true),
    };
    component.ngOnChanges(changes);
    component.setPageTo(2);
    const lastCall = mockArticlesService.query.mock.calls.at(-1)![0];
    expect(lastCall.filters.offset).toBe(10);
    expect(lastCall.filters.limit).toBe(10);
  });
});
