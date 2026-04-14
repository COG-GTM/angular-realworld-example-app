import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FavoriteButtonComponent } from './favorite-button.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

describe('FavoriteButtonComponent', () => {
  let component: FavoriteButtonComponent;
  let fixture: ComponentFixture<FavoriteButtonComponent>;
  let articlesService: any;
  let router: any;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test',
    description: 'Test',
    body: 'Test',
    tagList: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'testuser',
      bio: null,
      image: null,
      following: false,
    },
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(true);
    articlesService = {
      favorite: vi.fn().mockReturnValue(of({})),
      unfavorite: vi.fn().mockReturnValue(of({})),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [FavoriteButtonComponent],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        { provide: Router, useValue: router },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthenticatedSubject.asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(FavoriteButtonComponent);
    component = fixture.componentInstance;
    component.article = { ...mockArticle };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with isSubmitting as false', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should call favorite when article is not favorited', () => {
    component.article = { ...mockArticle, favorited: false };
    component.toggleFavorite();
    expect(articlesService.favorite).toHaveBeenCalledWith('test-article');
  });

  it('should call unfavorite when article is already favorited', () => {
    component.article = { ...mockArticle, favorited: true };
    component.toggleFavorite();
    expect(articlesService.unfavorite).toHaveBeenCalledWith('test-article');
  });

  it('should emit toggle event on success', () => {
    const toggleSpy = vi.spyOn(component.toggle, 'emit');
    component.article = { ...mockArticle, favorited: false };
    component.toggleFavorite();
    expect(toggleSpy).toHaveBeenCalledWith(true);
  });

  it('should navigate to register when not authenticated', () => {
    isAuthenticatedSubject.next(false);
    component.toggleFavorite();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should set isSubmitting to false on error', () => {
    articlesService.favorite.mockReturnValue(throwError(() => new Error('fail')));
    component.article = { ...mockArticle, favorited: false };
    component.toggleFavorite();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should set isSubmitting to false on success', () => {
    component.article = { ...mockArticle, favorited: false };
    component.toggleFavorite();
    expect(component.isSubmitting()).toBe(false);
  });
});
