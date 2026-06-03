import '../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach } from 'vitest';
import { ArticlePreviewComponent } from './article-preview.component';
import { Article } from '../models/article.model';

const article: Article = {
  slug: 's',
  title: 't',
  description: 'd',
  body: 'b',
  tagList: [],
  createdAt: '',
  updatedAt: '',
  favorited: false,
  favoritesCount: 5,
  author: { username: 'jane', bio: null, image: null, following: false },
};

describe('ArticlePreviewComponent', () => {
  let component: ArticlePreviewComponent;

  beforeEach(() => {
    component = new ArticlePreviewComponent();
    component.articleInput = { ...article };
  });

  it('should create and store the article via the input setter', () => {
    expect(component).toBeTruthy();
    expect(component.article().slug).toBe('s');
  });

  it('should increment favoritesCount when favorited', () => {
    component.toggleFavorite(true);
    expect(component.article().favorited).toBe(true);
    expect(component.article().favoritesCount).toBe(6);
  });

  it('should decrement favoritesCount when unfavorited', () => {
    component.articleInput = { ...article, favorited: true, favoritesCount: 5 };
    component.toggleFavorite(false);
    expect(component.article().favorited).toBe(false);
    expect(component.article().favoritesCount).toBe(4);
  });
});
