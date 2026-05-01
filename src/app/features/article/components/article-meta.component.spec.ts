import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ArticleMetaComponent } from './article-meta.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { Article } from '../models/article.model';

describe('ArticleMetaComponent', () => {
  let component: ArticleMetaComponent;
  let fixture: ComponentFixture<ArticleMetaComponent>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    tagList: ['angular', 'testing'],
    createdAt: '2024-06-15T10:30:00.000Z',
    updatedAt: '2024-06-15T12:00:00.000Z',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'johndoe',
      bio: 'A developer',
      image: 'http://example.com/avatar.jpg',
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
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render article-meta container', () => {
    const meta = fixture.debugElement.query(By.css('.article-meta'));
    expect(meta).toBeTruthy();
  });

  it('should display author username', () => {
    const authorLink = fixture.debugElement.query(By.css('.author'));
    expect(authorLink.nativeElement.textContent.trim()).toBe('johndoe');
  });

  it('should display formatted date', () => {
    const dateSpan = fixture.debugElement.query(By.css('.date'));
    expect(dateSpan.nativeElement.textContent.trim()).toContain('June');
    expect(dateSpan.nativeElement.textContent.trim()).toContain('2024');
  });

  it('should render author avatar image', () => {
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.src).toContain('example.com/avatar.jpg');
  });

  it('should have links to author profile', () => {
    const authorLink = fixture.debugElement.query(By.css('.author'));
    expect(authorLink).toBeTruthy();
    expect(authorLink.nativeElement.textContent.trim()).toBe('johndoe');
  });

  it('should use default image pipe when author has no image', () => {
    fixture.componentRef.setInput('article', {
      ...mockArticle,
      author: { ...mockArticle.author, image: null },
    });
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('img'));
    expect(img.nativeElement.getAttribute('src')).toBe('/assets/default-avatar.svg');
  });
});
