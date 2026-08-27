import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, map, of, throwError } from 'rxjs';
import { FavoriteButtonComponent } from './favorite-button.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';
import { User } from '../../../core/auth/user.model';

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test',
  description: '',
  body: '',
  tagList: [],
  createdAt: '',
  updatedAt: '',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'author1', bio: '', image: '', following: false },
};

const mockUser: User = { email: 'a@b.c', token: 't', username: 'me', bio: null, image: null };

describe('FavoriteButtonComponent', () => {
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

  function setup(user: User | null, article: Partial<Article> = {}) {
    const currentUser = new BehaviorSubject<User | null>(user);
    const articlesService = {
      favorite: vi.fn().mockReturnValue(of(mockArticle)),
      unfavorite: vi.fn().mockReturnValue(of(void 0)),
    };
    TestBed.configureTestingModule({
      imports: [FavoriteButtonComponent],
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
      ],
    });
    const fixture = TestBed.createComponent(FavoriteButtonComponent);
    fixture.componentInstance.article = { ...mockArticle, ...article };
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, articlesService, router };
  }

  it('should redirect to register when unauthenticated', () => {
    const { component, router, articlesService } = setup(null);
    component.toggleFavorite();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
    expect(articlesService.favorite).not.toHaveBeenCalled();
  });

  it('should favorite an unfavorited article and emit toggle', () => {
    const { component, articlesService } = setup(mockUser);
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);

    component.toggleFavorite();

    expect(articlesService.favorite).toHaveBeenCalledWith('test-article');
    expect(toggleSpy).toHaveBeenCalledWith(true);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should unfavorite a favorited article', () => {
    const { component, articlesService } = setup(mockUser, { favorited: true });
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);

    component.toggleFavorite();

    expect(articlesService.unfavorite).toHaveBeenCalledWith('test-article');
    expect(toggleSpy).toHaveBeenCalledWith(false);
  });

  it('should reset submitting state on error', () => {
    const { component, articlesService } = setup(mockUser);
    articlesService.favorite.mockReturnValue(throwError(() => new Error('fail')));

    component.toggleFavorite();

    expect(component.isSubmitting()).toBe(false);
  });
});
