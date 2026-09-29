import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { ArticlePreviewComponent } from './article-preview.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

describe('ArticlePreviewComponent optimistic favorite', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  const article: Article = {
    slug: 'test-article',
    title: 'Test',
    description: 'Desc',
    body: 'Body',
    tagList: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 3,
    author: { username: 'author', bio: null, image: '', following: false },
  };

  let favorite$: Subject<Article>;

  beforeEach(() => {
    favorite$ = new Subject<Article>();
    TestBed.configureTestingModule({
      imports: [ArticlePreviewComponent],
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: { favorite: vi.fn(() => favorite$), unfavorite: vi.fn() } },
        { provide: UserService, useValue: { isAuthenticated: new BehaviorSubject(true) } },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function render() {
    const fixture = TestBed.createComponent(ArticlePreviewComponent);
    fixture.componentRef.setInput('articleInput', article);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('app-favorite-button button');
    return { fixture, button };
  }

  it('increments the count before the server responds and keeps it on success', () => {
    const { fixture, button } = render();
    expect(button.textContent?.trim()).toContain('3');

    button.click();
    fixture.detectChanges();
    expect(button.textContent?.trim()).toContain('4');
    expect(button.classList).toContain('btn-primary');

    favorite$.next({ ...article, favorited: true, favoritesCount: 4 });
    favorite$.complete();
    fixture.detectChanges();
    expect(button.textContent?.trim()).toContain('4');
    expect(button.classList).toContain('btn-primary');
  });

  it('restores the count and style when the request fails', () => {
    const { fixture, button } = render();

    button.click();
    fixture.detectChanges();
    expect(button.textContent?.trim()).toContain('4');

    favorite$.error({ status: 500 });
    fixture.detectChanges();
    expect(button.textContent?.trim()).toContain('3');
    expect(button.classList).toContain('btn-outline-primary');
    expect(button.classList).not.toContain('btn-primary');
  });

  it('keeps the count consistent across rapid clicks', () => {
    const { fixture, button } = render();

    button.click();
    fixture.detectChanges();
    button.click();
    fixture.detectChanges();
    expect(button.textContent?.trim()).toContain('3');

    favorite$.error({ status: 500 });
    fixture.detectChanges();
    expect(button.textContent?.trim()).toContain('3');
    expect(button.classList).toContain('btn-outline-primary');
  });
});
