import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, map, of, throwError } from 'rxjs';
import ArticleComponent from './article.component';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';
import { User } from '../../../../core/auth/user.model';

const mockArticle: Article = {
  slug: 'test-article',
  title: 'Test Article',
  description: 'desc',
  body: '# Markdown body',
  tagList: ['angular'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  favorited: false,
  favoritesCount: 1,
  author: { username: 'author1', bio: '', image: '', following: false },
};

const mockComment: Comment = {
  id: '42',
  body: 'A comment',
  createdAt: '2024-01-02T00:00:00.000Z',
  author: { username: 'author1', bio: '', image: '', following: false },
};

const authorUser: User = { email: 'a@b.c', token: 't', username: 'author1', bio: null, image: null };

describe('ArticleComponent', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized
    }
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setup(user: User | null, options: { articleError?: unknown } = {}) {
    const currentUser = new BehaviorSubject<User | null>(user);
    const articlesService = {
      get: vi.fn().mockReturnValue(options.articleError ? throwError(() => options.articleError) : of(mockArticle)),
      delete: vi.fn().mockReturnValue(of(void 0)),
      favorite: vi.fn().mockReturnValue(of(mockArticle)),
      unfavorite: vi.fn().mockReturnValue(of(void 0)),
    };
    const commentsService = {
      getAll: vi.fn().mockReturnValue(of([mockComment])),
      add: vi.fn().mockReturnValue(of({ ...mockComment, id: '43', body: 'New comment' })),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    TestBed.configureTestingModule({
      imports: [ArticleComponent],
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: articlesService },
        { provide: CommentsService, useValue: commentsService },
        { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { slug: 'test-article' } } } },
      ],
    });
    const fixture = TestBed.createComponent(ArticleComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, articlesService, commentsService, router };
  }

  it('should load article, comments and set canModify for the author', () => {
    const { component } = setup(authorUser);
    expect(component.article()).toEqual(mockArticle);
    expect(component.comments()).toEqual([mockComment]);
    expect(component.canModify()).toBe(true);
  });

  it('should not allow modification for other users', () => {
    const { component } = setup(null);
    expect(component.canModify()).toBe(false);
  });

  it('should set errors when loading fails', () => {
    const { component } = setup(null, { articleError: { errors: { article: ['not found'] } } });
    expect(component.errors()).toEqual({ article: ['not found'] });
  });

  it('should update favorite state on toggle', () => {
    const { component } = setup(authorUser);
    component.onToggleFavorite(true);
    expect(component.article()!.favorited).toBe(true);
    expect(component.article()!.favoritesCount).toBe(2);
  });

  it('should update author following state', () => {
    const { component } = setup(authorUser);
    component.toggleFollowing({ ...mockArticle.author, following: true });
    expect(component.article()!.author.following).toBe(true);
  });

  it('should delete the article and navigate home', () => {
    const { component, articlesService, router } = setup(authorUser);
    component.deleteArticle();
    expect(articlesService.delete).toHaveBeenCalledWith('test-article');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should add a comment and reset the control', () => {
    const { component, commentsService } = setup(authorUser);
    component.commentControl.setValue('New comment');
    component.addComment();

    expect(commentsService.add).toHaveBeenCalledWith('test-article', 'New comment');
    expect(component.comments().length).toBe(2);
    expect(component.commentControl.value).toBe('');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should surface comment errors', () => {
    const { component, commentsService } = setup(authorUser);
    const errors = { errors: { body: ["can't be blank"] } };
    commentsService.add.mockReturnValue(throwError(() => errors));

    component.addComment();

    expect(component.commentFormErrors()).toEqual(errors);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should delete a comment', () => {
    const { component, commentsService } = setup(authorUser);
    component.deleteComment(mockComment);

    expect(commentsService.delete).toHaveBeenCalledWith('42', 'test-article');
    expect(component.comments()).toEqual([]);
  });

  it('should surface delete comment errors', () => {
    const { component, commentsService } = setup(authorUser);
    const errors = { errors: { comment: ['cannot delete'] } };
    commentsService.delete.mockReturnValue(throwError(() => errors));

    component.deleteComment(mockComment);

    expect(component.deleteCommentErrors()).toEqual(errors);
    expect(component.comments()).toEqual([mockComment]);
  });
});
