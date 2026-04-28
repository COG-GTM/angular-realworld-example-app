import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ArticleMetaComponent } from './article-meta.component';
import { Article } from '../models/article.model';
import { RouterTestingModule } from '@angular/router/testing';

describe('ArticleMetaComponent', () => {
  let component: ArticleMetaComponent;
  let fixture: ComponentFixture<ArticleMetaComponent>;

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: 'Test body',
    tagList: ['angular', 'testing'],
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-16T00:00:00.000Z',
    favorited: false,
    favoritesCount: 5,
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the author username', () => {
    const el: HTMLElement = fixture.nativeElement;
    const authorLink = el.querySelector('.author');
    expect(authorLink?.textContent?.trim()).toBe('testuser');
  });

  it('should display the article creation date', () => {
    const el: HTMLElement = fixture.nativeElement;
    const dateSpan = el.querySelector('.date');
    expect(dateSpan?.textContent?.trim()).toContain('January');
    expect(dateSpan?.textContent?.trim()).toContain('2024');
  });

  it('should render a link to the author profile', () => {
    const el: HTMLElement = fixture.nativeElement;
    const profileLinks = el.querySelectorAll('a[href]');
    const hrefs = Array.from(profileLinks).map(a => a.getAttribute('href'));
    expect(hrefs.some(h => h?.includes('/profile/testuser'))).toBe(true);
  });

  it('should render the author avatar image', () => {
    const el: HTMLElement = fixture.nativeElement;
    const img = el.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('should use default image when author has no image', () => {
    fixture.componentRef.setInput('article', {
      ...mockArticle,
      author: { ...mockArticle.author, image: null },
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const img = el.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/assets/default-avatar.svg');
  });

  it('should project ng-content', () => {
    const el: HTMLElement = fixture.nativeElement;
    const metaDiv = el.querySelector('.article-meta');
    expect(metaDiv).toBeTruthy();
  });
});
