import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FavoriteButtonComponent } from './favorite-button.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { ToastService } from '../../../core/notifications/toast.service';
import { Article } from '../models/article.model';
import { ApiError } from '../../../core/models/errors.model';
import { FORBIDDEN_MESSAGE } from '../../../core/errors/error-messages';

describe('FavoriteButtonComponent error handling', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let fixture: ComponentFixture<FavoriteButtonComponent>;
  let component: FavoriteButtonComponent;
  let articlesService: { favorite: ReturnType<typeof vi.fn>; unfavorite: ReturnType<typeof vi.fn> };
  let toastService: ToastService;

  const article: Article = {
    slug: 'test-article',
    title: 'Test',
    description: '',
    body: '',
    tagList: [],
    createdAt: '',
    updatedAt: '',
    favorited: false,
    favoritesCount: 0,
    author: { username: 'author', bio: '', image: '', following: false },
  };

  beforeEach(() => {
    articlesService = { favorite: vi.fn(), unfavorite: vi.fn() };
    TestBed.configureTestingModule({
      imports: [FavoriteButtonComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: { isAuthenticated: of(true) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(FavoriteButtonComponent);
    component = fixture.componentInstance;
    component.article = article;
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    toastService.clear();
    TestBed.resetTestingModule();
  });

  it('shows a toast, re-enables the button and does not emit when favoriting fails', () => {
    const emitted: boolean[] = [];
    component.toggle.subscribe(v => emitted.push(v));
    articlesService.favorite.mockReturnValue(throwError(() => ({ errors: {}, status: 403 }) satisfies ApiError));

    component.toggleFavorite();

    expect(component.isSubmitting()).toBe(false);
    expect(emitted).toEqual([]);
    expect(toastService.toasts()).toEqual([expect.objectContaining({ type: 'error', message: FORBIDDEN_MESSAGE })]);
  });

  it('does not show a second toast for errors the interceptor already reported', () => {
    articlesService.favorite.mockReturnValue(
      throwError(() => ({ errors: {}, status: 401, notified: true }) satisfies ApiError),
    );

    component.toggleFavorite();

    expect(component.isSubmitting()).toBe(false);
    expect(toastService.toasts()).toHaveLength(0);
  });
});
