import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ArticlePreviewComponent } from './article-preview.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../../../core/auth/services/user.service';
import { ArticlesService } from '../services/articles.service';
import { BehaviorSubject, of } from 'rxjs';
import { Article } from '../models/article.model';
import { By } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ArticlePreviewComponent', () => {
  let component: ArticlePreviewComponent;
  let fixture: ComponentFixture<ArticlePreviewComponent>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article Title',
    description: 'Test description',
    body: 'Test body',
    tagList: ['tag1', 'tag2'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'testuser',
      bio: 'test bio',
      image: 'http://example.com/avatar.png',
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
          provide: UserService,
          useValue: {
            currentUser: new BehaviorSubject(null).asObservable().pipe(distinctUntilChanged()),
            isAuthenticated: new BehaviorSubject(false).asObservable(),
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            favorite: () => of({}),
            unfavorite: () => of({}),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticlePreviewComponent);
    component = fixture.componentInstance;
    component.articleInput = { ...mockArticle };
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should set article via articleInput setter', () => {
    expect(component.article()).toEqual(mockArticle);
  });

  it('should render the article title', () => {
    const title = fixture.debugElement.query(By.css('h1'));
    expect(title).toBeTruthy();
    expect(title.nativeElement.textContent).toContain('Test Article Title');
  });

  it('should render the article description', () => {
    const desc = fixture.debugElement.query(By.css('p'));
    expect(desc).toBeTruthy();
    expect(desc.nativeElement.textContent).toContain('Test description');
  });

  it('should render Read more link', () => {
    const readMore = fixture.debugElement.query(By.css('.preview-link span'));
    expect(readMore).toBeTruthy();
    expect(readMore.nativeElement.textContent).toContain('Read more...');
  });

  it('should render tags', () => {
    const tags = fixture.debugElement.queryAll(By.css('.tag-list li'));
    expect(tags.length).toBe(2);
    expect(tags[0].nativeElement.textContent).toContain('tag1');
    expect(tags[1].nativeElement.textContent).toContain('tag2');
  });

  it('should increment favoritesCount when toggling favorite on', () => {
    component.toggleFavorite(true);
    expect(component.article().favorited).toBe(true);
    expect(component.article().favoritesCount).toBe(6);
  });

  it('should decrement favoritesCount when toggling favorite off', () => {
    component.articleInput = { ...mockArticle, favorited: true, favoritesCount: 5 };
    component.toggleFavorite(false);
    expect(component.article().favorited).toBe(false);
    expect(component.article().favoritesCount).toBe(4);
  });
});
