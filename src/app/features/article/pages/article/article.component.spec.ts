import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import ArticleComponent from './article.component';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';
import { User } from '../../../../core/auth/user.model';
import { Profile } from '../../../profile/models/profile.model';

describe('ArticleComponent', () => {
  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;
  let articlesService: any;
  let commentsService: any;
  let router: any;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockAuthor: Profile = {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: '# Test Body',
    tagList: ['tag1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 5,
    author: mockAuthor,
  };

  const mockComments: Comment[] = [
    { id: '1', body: 'Comment 1', createdAt: '2024-01-01', author: mockAuthor },
    { id: '2', body: 'Comment 2', createdAt: '2024-01-02', author: mockAuthor },
  ];

  const mockUser: User = {
    email: 'test@test.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);
    articlesService = {
      get: vi.fn().mockReturnValue(of(mockArticle)),
      delete: vi.fn().mockReturnValue(of({})),
      favorite: vi.fn().mockReturnValue(of({})),
      unfavorite: vi.fn().mockReturnValue(of({})),
    };
    commentsService = {
      getAll: vi.fn().mockReturnValue(of(mockComments)),
      add: vi.fn().mockReturnValue(of({ id: '3', body: 'New comment', createdAt: '2024-01-03', author: mockAuthor })),
      delete: vi.fn().mockReturnValue(of({})),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ArticleComponent, RouterTestingModule],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        { provide: CommentsService, useValue: commentsService },
        { provide: Router, useValue: router },
        {
          provide: UserService,
          useValue: {
            currentUser: currentUserSubject.asObservable(),
            isAuthenticated: currentUserSubject.pipe(),
            authState: new BehaviorSubject('authenticated').asObservable(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { slug: 'test-article' } },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load article and comments on init', () => {
    component.ngOnInit();
    expect(articlesService.get).toHaveBeenCalledWith('test-article');
    expect(commentsService.getAll).toHaveBeenCalledWith('test-article');
    expect(component.article()).toEqual(mockArticle);
    expect(component.comments().length).toBe(2);
  });

  it('should set canModify to true when user is the author', () => {
    component.ngOnInit();
    expect(component.canModify()).toBe(true);
  });

  it('should set canModify to false when user is not the author', () => {
    currentUserSubject.next({ ...mockUser, username: 'otheruser' });
    component.ngOnInit();
    expect(component.canModify()).toBe(false);
  });

  it('should handle onToggleFavorite true', () => {
    component.ngOnInit();
    component.onToggleFavorite(true);
    expect(component.article()!.favorited).toBe(true);
    expect(component.article()!.favoritesCount).toBe(6);
  });

  it('should handle onToggleFavorite false', () => {
    component.ngOnInit();
    component.article.set({ ...mockArticle, favorited: true, favoritesCount: 5 });
    component.onToggleFavorite(false);
    expect(component.article()!.favorited).toBe(false);
    expect(component.article()!.favoritesCount).toBe(4);
  });

  it('should handle onToggleFavorite with null article', () => {
    component.onToggleFavorite(true);
    expect(component.article()).toBeNull();
  });

  it('should toggle following', () => {
    component.ngOnInit();
    const updatedProfile: Profile = { ...mockAuthor, following: true };
    component.toggleFollowing(updatedProfile);
    expect(component.article()!.author.following).toBe(true);
  });

  it('should handle toggleFollowing with null article', () => {
    component.toggleFollowing({ ...mockAuthor, following: true });
    expect(component.article()).toBeNull();
  });

  it('should delete article and navigate to home', () => {
    component.ngOnInit();
    component.deleteArticle();
    expect(articlesService.delete).toHaveBeenCalledWith('test-article');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not delete when article is null', () => {
    component.deleteArticle();
    expect(articlesService.delete).not.toHaveBeenCalled();
  });

  it('should set isDeleting on delete', () => {
    component.ngOnInit();
    component.deleteArticle();
    expect(component.isDeleting()).toBe(true);
  });

  it('should add a comment', () => {
    component.ngOnInit();
    component.commentControl.setValue('New comment');
    component.addComment();
    expect(commentsService.add).toHaveBeenCalledWith('test-article', 'New comment');
    expect(component.comments().length).toBe(3);
    expect(component.comments()[0].body).toBe('New comment');
    expect(component.commentControl.value).toBe('');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not add comment when article is null', () => {
    component.addComment();
    expect(commentsService.add).not.toHaveBeenCalled();
  });

  it('should handle add comment error', () => {
    component.ngOnInit();
    commentsService.add.mockReturnValue(throwError(() => ({ errors: { body: 'is required' } })));
    component.commentControl.setValue('New comment');
    component.addComment();
    expect(component.isSubmitting()).toBe(false);
    expect(component.commentFormErrors()).toBeTruthy();
  });

  it('should delete a comment', () => {
    component.ngOnInit();
    const commentToDelete = mockComments[0];
    component.deleteComment(commentToDelete);
    expect(commentsService.delete).toHaveBeenCalledWith('1', 'test-article');
    expect(component.comments().length).toBe(1);
  });

  it('should not delete comment when article is null', () => {
    component.deleteComment(mockComments[0]);
    expect(commentsService.delete).not.toHaveBeenCalled();
  });

  it('should handle delete comment error', () => {
    component.ngOnInit();
    commentsService.delete.mockReturnValue(throwError(() => ({ errors: { error: 'failed' } })));
    component.deleteComment(mockComments[0]);
    expect(component.deleteCommentErrors()).toBeTruthy();
  });

  it('should handle article load error', () => {
    articlesService.get.mockReturnValue(throwError(() => ({ errors: { article: 'not found' } })));
    component.ngOnInit();
    expect(component.errors()).toBeTruthy();
  });

  it('should handle article load error without errors property', () => {
    articlesService.get.mockReturnValue(throwError(() => ({})));
    component.ngOnInit();
    expect(component.errors()).toBeTruthy();
  });
});
