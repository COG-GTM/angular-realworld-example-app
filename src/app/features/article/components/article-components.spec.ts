import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, map, of } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { ArticleMetaComponent } from './article-meta.component';
import { ArticlePreviewComponent } from './article-preview.component';
import { ArticleCommentComponent } from './article-comment.component';
import { ArticleListComponent } from './article-list.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';
import { Comment } from '../models/comment.model';
import { User } from '../../../core/auth/user.model';
import { LoadingState } from '../../../core/models/loading-state.model';

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'A test description',
  body: 'Body',
  tagList: ['angular', 'testing'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  favorited: false,
  favoritesCount: 3,
  author: { username: 'author1', bio: '', image: '', following: false },
};

const mockUser: User = { email: 'a@b.c', token: 't', username: 'author1', bio: null, image: null };

describe('article components', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('ArticleMetaComponent', () => {
    it('should render author and date', () => {
      TestBed.configureTestingModule({
        imports: [ArticleMetaComponent],
        providers: [provideRouter([])],
      });
      const fixture = TestBed.createComponent(ArticleMetaComponent);
      fixture.componentInstance.article = mockArticle;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('author1');
      expect(fixture.nativeElement.textContent).toContain('January 1, 2024');
    });
  });

  describe('ArticlePreviewComponent', () => {
    function setup() {
      const currentUser = new BehaviorSubject<User | null>(null);
      TestBed.configureTestingModule({
        imports: [ArticlePreviewComponent],
        providers: [
          provideRouter([]),
          { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
          { provide: ArticlesService, useValue: {} },
        ],
      });
      const fixture = TestBed.createComponent(ArticlePreviewComponent);
      fixture.componentInstance.articleInput = { ...mockArticle };
      fixture.detectChanges();
      return fixture;
    }

    it('should render title, description and tags', () => {
      const fixture = setup();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Test Article');
      expect(text).toContain('A test description');
      expect(text).toContain('angular');
      expect(text).toContain('testing');
    });

    it('should update favorite state on toggle', () => {
      const fixture = setup();
      fixture.componentInstance.toggleFavorite(true);
      expect(fixture.componentInstance.article().favorited).toBe(true);
      expect(fixture.componentInstance.article().favoritesCount).toBe(4);

      fixture.componentInstance.toggleFavorite(false);
      expect(fixture.componentInstance.article().favorited).toBe(false);
      expect(fixture.componentInstance.article().favoritesCount).toBe(3);
    });
  });

  describe('ArticleCommentComponent', () => {
    const mockComment: Comment = {
      id: '1',
      body: 'Nice article!',
      createdAt: '2024-02-02T00:00:00.000Z',
      author: { username: 'author1', bio: '', image: '', following: false },
    };

    function setup(user: User | null) {
      const currentUser = new BehaviorSubject<User | null>(user);
      TestBed.configureTestingModule({
        imports: [ArticleCommentComponent],
        providers: [provideRouter([]), { provide: UserService, useValue: { currentUser } }],
      });
      const fixture = TestBed.createComponent(ArticleCommentComponent);
      fixture.componentInstance.comment = mockComment;
      fixture.detectChanges();
      return fixture;
    }

    it('should render the comment body and author', () => {
      const fixture = setup(null);
      expect(fixture.nativeElement.textContent).toContain('Nice article!');
      expect(fixture.nativeElement.textContent).toContain('author1');
    });

    it('should show delete option only for the comment author', async () => {
      const fixture = setup(mockUser);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.mod-options')).toBeTruthy();
    });

    it('should emit delete when trash icon clicked', async () => {
      const fixture = setup(mockUser);
      await fixture.whenStable();
      fixture.detectChanges();
      const deleteSpy = vi.fn();
      fixture.componentInstance.delete.subscribe(deleteSpy);
      fixture.nativeElement.querySelector('.ion-trash-a').click();
      expect(deleteSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('ArticleListComponent', () => {
    function setup(queryResult = { articles: [mockArticle], articlesCount: 1 }) {
      const articlesService = { query: vi.fn().mockReturnValue(of(queryResult)) };
      const currentUser = new BehaviorSubject<User | null>(null);
      TestBed.configureTestingModule({
        imports: [ArticleListComponent],
        providers: [
          provideRouter([]),
          { provide: ArticlesService, useValue: articlesService },
          { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
        ],
      });
      const fixture = TestBed.createComponent(ArticleListComponent);
      fixture.componentInstance.limit = 10;
      return { fixture, articlesService };
    }

    function applyConfig(fixture: ReturnType<typeof TestBed.createComponent<ArticleListComponent>>) {
      const config = { type: 'all', filters: {} };
      fixture.componentInstance.config = config;
      fixture.componentInstance.ngOnChanges({
        config: new SimpleChange(undefined, config, true),
      });
      fixture.detectChanges();
    }

    it('should query articles when config changes', () => {
      const { fixture, articlesService } = setup();
      applyConfig(fixture);

      expect(articlesService.query).toHaveBeenCalled();
      expect(fixture.componentInstance.loading()).toBe(LoadingState.LOADED);
      expect(fixture.componentInstance.results()).toEqual([mockArticle]);
      expect(fixture.componentInstance.totalPages()).toEqual([1]);
    });

    it('should apply limit and offset filters', () => {
      const { fixture, articlesService } = setup();
      applyConfig(fixture);

      const query = articlesService.query.mock.calls[0][0];
      expect(query.filters.limit).toBe(10);
      expect(query.filters.offset).toBe(0);
    });

    it('should emit pageChange and re-query when page is set', () => {
      const { fixture, articlesService } = setup({ articles: [mockArticle], articlesCount: 25 });
      applyConfig(fixture);
      const pageSpy = vi.fn();
      fixture.componentInstance.pageChange.subscribe(pageSpy);

      fixture.componentInstance.setPageTo(2);

      expect(pageSpy).toHaveBeenCalledWith(2);
      expect(articlesService.query).toHaveBeenCalledTimes(2);
      const query = articlesService.query.mock.calls[1][0];
      expect(query.filters.offset).toBe(10);
    });

    it('should not re-query when setting the same page', () => {
      const { fixture, articlesService } = setup();
      applyConfig(fixture);

      fixture.componentInstance.setPageTo(1);

      expect(articlesService.query).toHaveBeenCalledTimes(1);
    });

    it('should show empty feed message when following feed has no articles', () => {
      const { fixture } = setup({ articles: [], articlesCount: 0 });
      fixture.componentInstance.isFollowingFeed = true;
      applyConfig(fixture);

      expect(fixture.nativeElement.textContent).toContain('Your feed is empty');
    });
  });
});
