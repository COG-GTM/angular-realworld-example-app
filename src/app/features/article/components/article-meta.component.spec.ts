import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ArticleMetaComponent } from './article-meta.component';
import { Article } from '../models/article.model';

describe('ArticleMetaComponent', () => {
  let component: ArticleMetaComponent;
  let fixture: ComponentFixture<ArticleMetaComponent>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    tagList: ['tag1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 0,
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
      imports: [ArticleMetaComponent, RouterTestingModule],
    });

    fixture = TestBed.createComponent(ArticleMetaComponent);
    component = fixture.componentInstance;
    component.article = mockArticle;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the author username', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('testuser');
  });

  it('should have article input', () => {
    expect(component.article).toEqual(mockArticle);
  });

  it('should render author image', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
  });
});
