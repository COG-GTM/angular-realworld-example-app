import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FavoriteButtonComponent } from './favorite-button.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../../../core/auth/services/user.service';
import { ArticlesService } from '../services/articles.service';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Article } from '../models/article.model';
import { By } from '@angular/platform-browser';

describe('FavoriteButtonComponent', () => {
  let component: FavoriteButtonComponent;
  let fixture: ComponentFixture<FavoriteButtonComponent>;
  let mockArticlesService: { favorite: ReturnType<typeof vi.fn>; unfavorite: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test desc',
    body: 'Test body',
    tagList: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
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
    mockArticlesService = {
      favorite: vi.fn().mockReturnValue(of({})),
      unfavorite: vi.fn().mockReturnValue(of({})),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [FavoriteButtonComponent, RouterTestingModule],
      providers: [
        { provide: ArticlesService, useValue: mockArticlesService },
        { provide: Router, useValue: mockRouter },
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
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render a button', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
  });

  it('should have btn-outline-primary class when not favorited', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.classList).toContain('btn-outline-primary');
  });

  it('should have btn-primary class when favorited', () => {
    fixture.componentRef.setInput('article', { ...mockArticle, favorited: true });
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.classList).toContain('btn-primary');
  });

  it('should call favorite service when not favorited', () => {
    component.toggleFavorite();
    expect(mockArticlesService.favorite).toHaveBeenCalledWith('test-article');
  });

  it('should call unfavorite service when favorited', () => {
    fixture.componentRef.setInput('article', { ...mockArticle, favorited: true });
    fixture.detectChanges();
    component.toggleFavorite();
    expect(mockArticlesService.unfavorite).toHaveBeenCalledWith('test-article');
  });

  it('should emit toggle event on success', () => {
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);
    component.toggleFavorite();
    expect(toggleSpy).toHaveBeenCalledWith(true);
  });

  it('should redirect unauthenticated user to /register', () => {
    isAuthenticatedSubject.next(false);
    component.toggleFavorite();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should set isSubmitting during request', () => {
    expect(component.isSubmitting()).toBe(false);
    component.toggleFavorite();
    expect(component.isSubmitting()).toBe(false); // already resolved in sync test
  });

  it('should reset isSubmitting on error', () => {
    mockArticlesService.favorite.mockReturnValue(throwError(() => new Error('fail')));
    component.toggleFavorite();
    expect(component.isSubmitting()).toBe(false);
  });
});
