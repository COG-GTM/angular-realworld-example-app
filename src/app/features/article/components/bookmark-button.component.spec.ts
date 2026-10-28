import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { BookmarkButtonComponent } from './bookmark-button.component';
import { ArticlesService } from '../services/articles.service';
import { AuthState, UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

describe('BookmarkButtonComponent', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized by test-setup
    }
  });

  const article: Article = {
    slug: 'how-to-build-webapps',
    title: 'How to build webapps that scale',
    description: 'Web development technologies...',
    body: 'Body',
    tagList: [],
    createdAt: '2024-10-27T00:00:00.000Z',
    updatedAt: '2024-10-27T00:00:00.000Z',
    favorited: false,
    favoritesCount: 12,
    bookmarked: false,
    author: { username: 'eric', bio: null, image: null, following: false },
  };

  let fixture: ComponentFixture<BookmarkButtonComponent>;
  let component: BookmarkButtonComponent;
  let authState: BehaviorSubject<AuthState>;
  let articlesService: { bookmark: ReturnType<typeof vi.fn>; unbookmark: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  function render(input: Article) {
    fixture = TestBed.createComponent(BookmarkButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('article', input);
    fixture.detectChanges();
  }

  beforeEach(() => {
    authState = new BehaviorSubject<AuthState>('authenticated');
    articlesService = { bookmark: vi.fn(), unbookmark: vi.fn() };
    router = { navigate: vi.fn().mockResolvedValue(true) };

    TestBed.configureTestingModule({
      imports: [BookmarkButtonComponent],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: { authState: authState.asObservable() } },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders an outlined "🔖 Save" button when not bookmarked', () => {
    render(article);
    expect(button().textContent?.trim()).toBe('🔖 Save');
    expect(button().classList).toContain('btn-bookmark');
    expect(button().classList).not.toContain('btn-bookmark-active');
    expect(button().getAttribute('aria-pressed')).toBe('false');
  });

  it('renders a filled "🔖 Saved" button when bookmarked and shows no count', () => {
    render({ ...article, bookmarked: true });
    expect(button().textContent?.trim()).toBe('🔖 Saved');
    expect(button().classList).toContain('btn-bookmark-active');
    expect(button().getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.textContent).not.toMatch(/\d/);
  });

  it('bookmarks and emits the updated article on success', () => {
    const response = { ...article, bookmarked: true };
    articlesService.bookmark.mockReturnValue(of(response));
    render(article);
    const emitted: Article[] = [];
    component.toggle.subscribe(a => emitted.push(a));

    button().click();

    expect(articlesService.bookmark).toHaveBeenCalledWith(article.slug);
    expect(articlesService.unbookmark).not.toHaveBeenCalled();
    expect(emitted).toEqual([response]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('unbookmarks when already saved', () => {
    articlesService.unbookmark.mockReturnValue(of({ ...article, bookmarked: false }));
    render({ ...article, bookmarked: true });
    const emitted: Article[] = [];
    component.toggle.subscribe(a => emitted.push(a));

    button().click();

    expect(articlesService.unbookmark).toHaveBeenCalledWith(article.slug);
    expect(emitted[0].bookmarked).toBe(false);
  });

  it('disables the button while the request is in flight and ignores repeat clicks', () => {
    const pending = new Subject<Article>();
    articlesService.bookmark.mockReturnValue(pending);
    render(article);

    button().click();
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');

    component.toggleBookmark();
    expect(articlesService.bookmark).toHaveBeenCalledTimes(1);

    pending.next({ ...article, bookmarked: true });
    pending.complete();
    fixture.detectChanges();
    expect(button().disabled).toBe(false);
  });

  it('shows an error and keeps the previous state when the request fails', () => {
    articlesService.bookmark.mockReturnValue(throwError(() => ({ status: 500, errors: { body: ['boom'] } })));
    render(article);
    const emitted: Article[] = [];
    component.toggle.subscribe(a => emitted.push(a));

    button().click();
    fixture.detectChanges();

    expect(emitted).toEqual([]);
    expect(button().textContent?.trim()).toBe('🔖 Save');
    expect(button().disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Could not update');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects anonymous users to /login without calling the API', () => {
    authState.next('unauthenticated');
    render(article);

    button().click();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(articlesService.bookmark).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('redirects to /login when the API responds 401', () => {
    articlesService.bookmark.mockReturnValue(throwError(() => ({ status: 401, errors: {} })));
    render(article);

    button().click();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('waits for auth initialization instead of redirecting a persisted session', () => {
    authState.next('loading');
    articlesService.bookmark.mockReturnValue(of({ ...article, bookmarked: true }));
    render(article);

    button().click();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(articlesService.bookmark).not.toHaveBeenCalled();

    authState.next('authenticated');
    expect(articlesService.bookmark).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
