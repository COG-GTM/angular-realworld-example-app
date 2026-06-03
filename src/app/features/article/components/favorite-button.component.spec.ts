import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { initTestBed } from '../../../../testing/setup-test-bed';
import { FavoriteButtonComponent } from './favorite-button.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

const article: Article = {
  slug: 'a-slug',
  title: 't',
  description: 'd',
  body: 'b',
  tagList: [],
  createdAt: '',
  updatedAt: '',
  favorited: false,
  favoritesCount: 3,
  author: { username: 'jane', bio: null, image: null, following: false },
};

describe('FavoriteButtonComponent', () => {
  let isAuthenticated$: BehaviorSubject<boolean>;
  let articlesService: { favorite: ReturnType<typeof vi.fn>; unfavorite: ReturnType<typeof vi.fn> };
  let userService: { isAuthenticated: BehaviorSubject<boolean> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let component: FavoriteButtonComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject<boolean>(true);
    articlesService = { favorite: vi.fn(), unfavorite: vi.fn() };
    userService = { isAuthenticated: isAuthenticated$ };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        FavoriteButtonComponent,
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
      ],
    });

    component = TestBed.inject(FavoriteButtonComponent);
    component.article = { ...article };
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect unauthenticated users to register', () => {
    isAuthenticated$.next(false);
    component.toggleFavorite();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
    expect(articlesService.favorite).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(true);
  });

  it('should favorite an article that is not yet favorited', () => {
    articlesService.favorite.mockReturnValue(of(article));
    const spy = vi.fn();
    component.toggle.subscribe(spy);

    component.toggleFavorite();

    expect(articlesService.favorite).toHaveBeenCalledWith('a-slug');
    expect(spy).toHaveBeenCalledWith(true);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should unfavorite an article that is already favorited', () => {
    component.article = { ...article, favorited: true };
    articlesService.unfavorite.mockReturnValue(of(undefined));
    const spy = vi.fn();
    component.toggle.subscribe(spy);

    component.toggleFavorite();

    expect(articlesService.unfavorite).toHaveBeenCalledWith('a-slug');
    expect(spy).toHaveBeenCalledWith(false);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should reset submitting state on error', () => {
    articlesService.favorite.mockReturnValue(throwError(() => new Error('fail')));
    component.toggleFavorite();
    expect(component.isSubmitting()).toBe(false);
  });
});
