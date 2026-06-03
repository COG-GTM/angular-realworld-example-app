import '../../../../testing/setup-test-bed';
import { describe, it, expect } from 'vitest';
import { ArticleMetaComponent } from './article-meta.component';
import { Article } from '../models/article.model';

const article: Article = {
  slug: 's',
  title: 't',
  description: 'd',
  body: 'b',
  tagList: ['x'],
  createdAt: '2020-01-01',
  updatedAt: '2020-01-01',
  favorited: false,
  favoritesCount: 0,
  author: { username: 'jane', bio: null, image: null, following: false },
};

describe('ArticleMetaComponent', () => {
  it('should create and accept an article input', () => {
    const component = new ArticleMetaComponent();
    component.article = article;
    expect(component).toBeTruthy();
    expect(component.article.author.username).toBe('jane');
  });
});
