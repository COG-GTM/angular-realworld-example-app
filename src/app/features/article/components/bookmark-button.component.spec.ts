import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BookmarkButtonComponent } from './bookmark-button.component';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

describe('BookmarkButtonComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  const article: Article = {
    slug: 'how-to-build-webapps-that-scale',
    title: 'How to build webapps that scale',
    description: 'Web development technologies have evolved...',
    body: 'body',
    tagList: [],
    createdAt: '2026-10-27T00:00:00.000Z',
    updatedAt: '2026-10-27T00:00:00.000Z',
    favorited: false,
    favoritesCount: 12,
    bookmarked: false,
    author: { username: 'eric', bio: null, image: '', following: false },
  };

  let fixture: ComponentFixture<BookmarkButtonComponent>;
  let httpMock: HttpTestingController;
  let isAuthenticated: BehaviorSubject<boolean>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let emitted: boolean[];

  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  const render = (value: Article) => {
    fixture.componentRef.setInput('article', value);
    fixture.detectChanges();
  };

  beforeEach(() => {
    isAuthenticated = new BehaviorSubject(true);
    router = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      imports: [BookmarkButtonComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: { isAuthenticated } },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(BookmarkButtonComponent);
    httpMock = TestBed.inject(HttpTestingController);
    emitted = [];
    fixture.componentInstance.toggle.subscribe(value => emitted.push(value));
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('renders an outline "Save" button when not bookmarked', () => {
    render(article);
    expect(button().textContent?.trim()).toBe('🔖 Save');
    expect(button().classList).toContain('btn-sm');
    expect(button().classList).toContain('btn-outline-bookmark');
    expect(button().classList).not.toContain('btn-bookmark');
  });

  it('renders a filled "Saved" button when bookmarked', () => {
    render({ ...article, bookmarked: true });
    expect(button().textContent?.trim()).toBe('🔖 Saved');
    expect(button().classList).toContain('btn-bookmark');
    expect(button().classList).not.toContain('btn-outline-bookmark');
  });

  it('treats a missing bookmarked field as not saved', () => {
    const { bookmarked: _ignored, ...withoutField } = article;
    render(withoutField as Article);
    expect(button().textContent?.trim()).toBe('🔖 Save');
  });

  it('bookmarks the article when not saved and emits true', () => {
    render(article);
    button().click();
    const req = httpMock.expectOne(`/articles/${article.slug}/bookmark`);
    expect(req.request.method).toBe('POST');
    req.flush({ article: { ...article, bookmarked: true } });
    expect(emitted).toEqual([true]);
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });

  it('unbookmarks the article when saved and emits false', () => {
    render({ ...article, bookmarked: true });
    button().click();
    const req = httpMock.expectOne(`/articles/${article.slug}/bookmark`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ article: { ...article, bookmarked: false } });
    expect(emitted).toEqual([false]);
  });

  it('does not emit when the request fails', () => {
    render(article);
    button().click();
    httpMock.expectOne(`/articles/${article.slug}/bookmark`).flush(null, { status: 500, statusText: 'Error' });
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });

  it('redirects anonymous users to /login without calling the API', () => {
    isAuthenticated.next(false);
    render(article);
    button().click();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    httpMock.expectNone(() => true);
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance.isSubmitting()).toBe(false);
  });
});
