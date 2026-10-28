import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { Component } from '@angular/core';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import ProfileReadingListComponent from './profile-reading-list.component';
import { AuthState, UserService } from '../../../core/auth/services/user.service';
import { User } from '../../../core/auth/user.model';
import { Article } from '../../article/models/article.model';

@Component({ template: '<router-outlet />', imports: [RouterOutlet] })
class ProfileShellStub {}

@Component({ template: 'my posts' })
class ProfileArticlesStub {}

describe('ProfileReadingListComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  const ana = { username: 'ana', email: 'ana@example.com', token: 't', bio: null, image: null } as unknown as User;

  const makeArticle = (slug: string, author: string, title: string): Article => ({
    slug,
    title,
    description: `${title} description`,
    body: 'body',
    tagList: [],
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    favorited: false,
    favoritesCount: 3,
    bookmarked: true,
    author: { username: author, bio: null, image: '', following: false },
  });

  const saved = [
    makeArticle('how-to-build-webapps-that-scale', 'eric', 'How to build webapps that scale'),
    makeArticle('event-driven-payments-with-spring', 'sara', 'Event-driven payments with Spring'),
  ];

  let httpMock: HttpTestingController;
  let currentUser: User | null;
  let authState: BehaviorSubject<AuthState>;

  beforeEach(() => {
    currentUser = ana;
    authState = new BehaviorSubject<AuthState>('authenticated');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'profile/:username',
            component: ProfileShellStub,
            children: [
              { path: '', component: ProfileArticlesStub },
              { path: 'reading-list', component: ProfileReadingListComponent },
            ],
          },
        ]),
        {
          provide: UserService,
          useValue: {
            authState,
            isAuthenticated: new BehaviorSubject(true),
            getCurrentUserSync: () => currentUser,
          },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  const cards = (el: HTMLElement) => Array.from(el.querySelectorAll('.reading-list-item')) as HTMLElement[];

  it("renders the current user's saved articles with a filled Saved button and no count", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana/reading-list');

    const req = httpMock.expectOne(r => r.url === '/articles/bookmarked');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('offset')).toBe('0');
    req.flush({ articles: saved, articlesCount: 2 });
    harness.detectChanges();

    const el = harness.routeNativeElement!;
    const items = cards(el);
    expect(items.length).toBe(2);
    expect(items[0].querySelector('h1')?.textContent).toContain('How to build webapps that scale');
    expect(items[0].querySelector('.author')?.textContent).toContain('eric');
    expect(items[0].querySelector('p')?.textContent).toContain('How to build webapps that scale description');
    expect(items[0].querySelector('a.preview-link')?.getAttribute('href')).toBe(
      '/article/how-to-build-webapps-that-scale',
    );
    const button = items[0].querySelector('button')!;
    expect(button.textContent?.trim()).toBe('🔖 Saved');
    expect(button.classList).toContain('btn-bookmark');
    expect(el.querySelector('.counter')).toBeNull();
    expect(el.querySelector('.ion-heart')).toBeNull();
    expect(el.querySelector('.pagination')).toBeNull();
  });

  it('shows the exact empty state text when nothing is saved', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana/reading-list');
    httpMock.expectOne(r => r.url === '/articles/bookmarked').flush({ articles: [], articlesCount: 0 });
    harness.detectChanges();

    const el = harness.routeNativeElement!;
    expect(cards(el).length).toBe(0);
    expect(el.querySelector('.empty-reading-list-message')?.textContent?.trim()).toBe(
      'Nothing saved yet. Use 🔖 Save on any article.',
    );
  });

  it('removes the card when an article is un-saved', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana/reading-list');
    httpMock.expectOne(r => r.url === '/articles/bookmarked').flush({ articles: saved, articlesCount: 2 });
    harness.detectChanges();

    const el = harness.routeNativeElement!;
    (cards(el)[0].querySelector('button') as HTMLButtonElement).click();
    const req = httpMock.expectOne('/articles/how-to-build-webapps-that-scale/bookmark');
    expect(req.request.method).toBe('DELETE');
    req.flush({ article: { ...saved[0], bookmarked: false } });
    harness.detectChanges();

    const remaining = cards(el);
    expect(remaining.length).toBe(1);
    expect(remaining[0].querySelector('h1')?.textContent).toContain('Event-driven payments with Spring');

    (remaining[0].querySelector('button') as HTMLButtonElement).click();
    httpMock
      .expectOne('/articles/event-driven-payments-with-spring/bookmark')
      .flush({ article: { ...saved[1], bookmarked: false } });
    harness.detectChanges();
    expect(el.querySelector('.empty-reading-list-message')?.textContent?.trim()).toBe(
      'Nothing saved yet. Use 🔖 Save on any article.',
    );
  });

  it('paginates when articlesCount exceeds the page size', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana/reading-list');
    httpMock.expectOne(r => r.url === '/articles/bookmarked').flush({ articles: saved, articlesCount: 25 });
    harness.detectChanges();

    const el = harness.routeNativeElement!;
    const pages = el.querySelectorAll('.pagination .page-link');
    expect(pages.length).toBe(3);
    (pages[1] as HTMLButtonElement).click();
    const req = httpMock.expectOne(r => r.url === '/articles/bookmarked');
    expect(req.request.params.get('offset')).toBe('10');
    req.flush({ articles: [], articlesCount: 25 });
  });

  it("redirects to the profile and never requests bookmarks on someone else's profile", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/eric/reading-list');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/profile/eric');
    httpMock.expectNone(r => r.url === '/articles/bookmarked');
  });

  it('redirects anonymous users away from the reading list', async () => {
    currentUser = null;
    authState.next('unauthenticated');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana/reading-list');
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/profile/ana');
    httpMock.expectNone(r => r.url === '/articles/bookmarked');
  });
});
