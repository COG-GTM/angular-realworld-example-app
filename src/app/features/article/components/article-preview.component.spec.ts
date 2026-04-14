import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ArticlePreviewComponent } from './article-preview.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

describe('ArticlePreviewComponent', () => {
  let component: ArticlePreviewComponent;
  let fixture: ComponentFixture<ArticlePreviewComponent>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    tagList: ['tag1', 'tag2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ArticlePreviewComponent, RouterTestingModule],
      providers: [
        {
          provide: ArticlesService,
          useValue: {
            favorite: vi.fn().mockReturnValue(of({})),
            unfavorite: vi.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: new BehaviorSubject(true).asObservable(),
            currentUser: new BehaviorSubject(null).asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticlePreviewComponent);
    component = fixture.componentInstance;
    component.articleInput = mockArticle;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set article via articleInput setter', () => {
    expect(component.article()).toEqual(mockArticle);
  });

  it('should update article when articleInput changes', () => {
    const newArticle = { ...mockArticle, title: 'New Title' };
    component.articleInput = newArticle;
    expect(component.article().title).toBe('New Title');
  });

  it('should toggle favorite to true', () => {
    component.toggleFavorite(true);
    expect(component.article().favorited).toBe(true);
    expect(component.article().favoritesCount).toBe(6);
  });

  it('should toggle favorite to false', () => {
    component.articleInput = { ...mockArticle, favorited: true, favoritesCount: 5 };
    component.toggleFavorite(false);
    expect(component.article().favorited).toBe(false);
    expect(component.article().favoritesCount).toBe(4);
  });

  it('should display article title', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test Article');
  });

  it('should display article description', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test description');
  });

  it('should display tags', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('tag1');
    expect(el.textContent).toContain('tag2');
  });

  it('should display favorites count', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('5');
  });
});
