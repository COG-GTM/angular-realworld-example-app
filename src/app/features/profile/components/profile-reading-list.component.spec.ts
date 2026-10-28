import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import ProfileReadingListComponent from './profile-reading-list.component';
import { ArticlesService } from '../../article/services/articles.service';
import { AuthState, UserService } from '../../../core/auth/services/user.service';
import { Article } from '../../article/models/article.model';

describe('ProfileReadingListComponent', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized by test-setup
    }
  });

  const makeArticle = (n: number): Article => ({
    slug: `article-${n}`,
    title: `Article ${n}`,
    description: `Description ${n}`,
    body: 'Body',
    tagList: [],
    createdAt: '2024-10-27T00:00:00.000Z',
    updatedAt: '2024-10-27T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
    bookmarked: true,
    author: { username: 'eric', bio: null, image: null, following: false },
  });

  let fixture: ComponentFixture<ProfileReadingListComponent>;
  let component: ProfileReadingListComponent;
  let articlesService: {
    queryBookmarked: ReturnType<typeof vi.fn>;
    bookmark: ReturnType<typeof vi.fn>;
    unbookmark: ReturnType<typeof vi.fn>;
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const cards = () => Array.from(el().querySelectorAll('.preview-link h1')).map(h => h.textContent?.trim());
  const pages = () => Array.from(el().querySelectorAll('.page-link')).map(b => b.textContent?.trim());
  const savedButtons = () => Array.from(el().querySelectorAll<HTMLButtonElement>('app-bookmark-button button'));

  function render() {
    fixture = TestBed.createComponent(ProfileReadingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    articlesService = { queryBookmarked: vi.fn(), bookmark: vi.fn(), unbookmark: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProfileReadingListComponent],
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: { authState: new BehaviorSubject<AuthState>('authenticated') } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('loads the first page of the current user’s reading list in API order (newest saved first)', () => {
    articlesService.queryBookmarked.mockReturnValue(
      of({ articles: [makeArticle(2), makeArticle(1)], articlesCount: 2 }),
    );
    render();

    expect(articlesService.queryBookmarked).toHaveBeenCalledWith(10, 0);
    expect(cards()).toEqual(['Article 2', 'Article 1']);
    expect(savedButtons().map(b => b.textContent?.trim())).toEqual(['🔖 Saved', '🔖 Saved']);
    expect(pages()).toEqual([]);
  });

  it('shows the exact empty state text', () => {
    articlesService.queryBookmarked.mockReturnValue(of({ articles: [], articlesCount: 0 }));
    render();
    expect(el().querySelector('.empty-reading-list')?.textContent?.trim()).toBe(
      'Nothing saved yet. Use 🔖 Save on any article.',
    );
  });

  it('removes the card immediately on unsave and shows the empty state when the last one is removed', () => {
    articlesService.queryBookmarked.mockReturnValue(of({ articles: [makeArticle(1)], articlesCount: 1 }));
    articlesService.unbookmark.mockReturnValue(of({ ...makeArticle(1), bookmarked: false }));
    render();

    savedButtons()[0].click();
    fixture.detectChanges();

    expect(articlesService.unbookmark).toHaveBeenCalledWith('article-1');
    expect(cards()).toEqual([]);
    expect(component.articlesCount()).toBe(0);
    expect(el().textContent).toContain('Nothing saved yet. Use 🔖 Save on any article.');
    expect(articlesService.queryBookmarked).toHaveBeenCalledTimes(1);
  });

  it('keeps the card and shows an error when unsave fails', () => {
    articlesService.queryBookmarked.mockReturnValue(of({ articles: [makeArticle(1)], articlesCount: 1 }));
    articlesService.unbookmark.mockReturnValue(throwError(() => ({ status: 500 })));
    render();

    savedButtons()[0].click();
    fixture.detectChanges();

    expect(cards()).toEqual(['Article 1']);
    expect(component.articlesCount()).toBe(1);
    expect(el().querySelector('[role="alert"]')).not.toBeNull();
  });

  it('paginates with limit/offset and updates pagination after unsave', () => {
    const page1 = Array.from({ length: 10 }, (_, i) => makeArticle(11 - i));
    articlesService.queryBookmarked.mockImplementation((limit: number, offset: number) =>
      offset === 0 ? of({ articles: page1, articlesCount: 11 }) : of({ articles: [makeArticle(1)], articlesCount: 11 }),
    );
    render();
    expect(pages()).toEqual(['1', '2']);

    el().querySelectorAll<HTMLButtonElement>('.page-link')[1].click();
    fixture.detectChanges();
    expect(articlesService.queryBookmarked).toHaveBeenLastCalledWith(10, 10);
    expect(cards()).toEqual(['Article 1']);

    // Unsaving the only card on page 2 drops back to page 1 and the pager collapses
    articlesService.unbookmark.mockReturnValue(of({ ...makeArticle(1), bookmarked: false }));
    articlesService.queryBookmarked.mockReturnValue(of({ articles: page1, articlesCount: 10 }));
    savedButtons()[0].click();
    fixture.detectChanges();

    expect(component.page()).toBe(1);
    expect(articlesService.queryBookmarked).toHaveBeenLastCalledWith(10, 0);
    expect(cards()).toHaveLength(10);
    expect(pages()).toEqual([]);
  });

  it('backfills the current page from the next page after unsave', () => {
    const page1 = Array.from({ length: 10 }, (_, i) => makeArticle(11 - i));
    articlesService.queryBookmarked.mockReturnValueOnce(of({ articles: page1, articlesCount: 11 }));
    render();

    articlesService.unbookmark.mockReturnValue(of({ ...makeArticle(11), bookmarked: false }));
    articlesService.queryBookmarked.mockReturnValueOnce(
      of({ articles: [...page1.slice(1), makeArticle(1)], articlesCount: 10 }),
    );
    savedButtons()[0].click();
    fixture.detectChanges();

    expect(articlesService.queryBookmarked).toHaveBeenLastCalledWith(10, 0);
    expect(cards()).toHaveLength(10);
    expect(cards()).not.toContain('Article 11');
    expect(cards()[9]).toBe('Article 1');
    expect(pages()).toEqual([]);
  });

  it('shows a retryable error when loading fails', () => {
    articlesService.queryBookmarked.mockReturnValueOnce(throwError(() => ({ status: 500 })));
    render();
    expect(el().querySelector('.reading-list-error')).not.toBeNull();

    articlesService.queryBookmarked.mockReturnValueOnce(of({ articles: [makeArticle(1)], articlesCount: 1 }));
    (el().querySelector('.reading-list-error button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('.reading-list-error')).toBeNull();
    expect(cards()).toEqual(['Article 1']);
  });
});
