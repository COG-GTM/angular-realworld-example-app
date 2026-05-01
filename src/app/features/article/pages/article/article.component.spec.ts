import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import ArticleComponent from './article.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';
import { User } from '../../../../core/auth/user.model';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ArticleComponent', () => {
  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;
  let mockArticlesService: Record<string, ReturnType<typeof vi.fn>>;
  let mockCommentsService: Record<string, ReturnType<typeof vi.fn>>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let userSubject: BehaviorSubject<User | null>;

  const mockAuthor = {
    username: 'author',
    bio: 'bio',
    image: 'http://example.com/img.png',
    following: false,
  };

  const mockArticle: Article = {
    slug: 'test-slug',
    title: 'Test Article',
    description: 'Test description',
    body: '## Hello world',
    tagList: ['tag1'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 3,
    author: mockAuthor,
  };

  const mockComment: Comment = {
    id: '1',
    body: 'Great article!',
    createdAt: '2024-01-01T00:00:00.000Z',
    author: mockAuthor,
  };

  const mockUser: User = {
    email: 'author@test.com',
    token: 'token',
    username: 'author',
    bio: null,
    image: null,
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    userSubject = new BehaviorSubject<User | null>(mockUser);
    mockArticlesService = {
      get: vi.fn().mockReturnValue(of(mockArticle)),
      delete: vi.fn().mockReturnValue(of(void 0)),
      favorite: vi.fn().mockReturnValue(of({})),
      unfavorite: vi.fn().mockReturnValue(of({})),
    };
    mockCommentsService = {
      getAll: vi.fn().mockReturnValue(of([mockComment])),
      add: vi.fn().mockReturnValue(of({ ...mockComment, id: '2', body: 'New comment' })),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ArticleComponent, RouterTestingModule],
      providers: [
        { provide: ArticlesService, useValue: mockArticlesService },
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ProfileService,
          useValue: {
            follow: vi.fn().mockReturnValue(of({})),
            unfollow: vi.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: UserService,
          useValue: {
            currentUser: userSubject.asObservable().pipe(distinctUntilChanged()),
            isAuthenticated: userSubject.pipe(distinctUntilChanged()).pipe(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { slug: 'test-slug' } },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should load article on init', () => {
    component.ngOnInit();
    expect(mockArticlesService['get']).toHaveBeenCalledWith('test-slug');
    expect(component.article()).toEqual(mockArticle);
  });

  it('should load comments on init', () => {
    component.ngOnInit();
    expect(mockCommentsService['getAll']).toHaveBeenCalledWith('test-slug');
    expect(component.comments()).toEqual([mockComment]);
  });

  it('should set canModify to true when current user is the author', () => {
    component.ngOnInit();
    expect(component.canModify()).toBe(true);
  });

  it('should set canModify to false when current user is not the author', () => {
    userSubject.next({ ...mockUser, username: 'otheruser' });
    component.ngOnInit();
    expect(component.canModify()).toBe(false);
  });

  it('should toggle favorite', () => {
    component.ngOnInit();
    component.onToggleFavorite(true);
    expect(component.article()!.favorited).toBe(true);
    expect(component.article()!.favoritesCount).toBe(4);
  });

  it('should toggle unfavorite', () => {
    component.ngOnInit();
    component.onToggleFavorite(true);
    component.onToggleFavorite(false);
    expect(component.article()!.favorited).toBe(false);
    expect(component.article()!.favoritesCount).toBe(3);
  });

  it('should update following state on toggleFollowing', () => {
    component.ngOnInit();
    component.toggleFollowing({ ...mockAuthor, following: true });
    expect(component.article()!.author.following).toBe(true);
  });

  it('should delete article and navigate home', () => {
    component.ngOnInit();
    component.deleteArticle();
    expect(mockArticlesService['delete']).toHaveBeenCalledWith('test-slug');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not delete article when article is null', () => {
    component.deleteArticle();
    expect(mockArticlesService['delete']).not.toHaveBeenCalled();
  });

  it('should add a comment', () => {
    component.ngOnInit();
    component.commentControl.setValue('New comment');
    component.addComment();
    expect(mockCommentsService['add']).toHaveBeenCalledWith('test-slug', 'New comment');
    expect(component.comments().length).toBe(2);
    expect(component.commentControl.value).toBe('');
  });

  it('should set commentFormErrors on add comment failure', () => {
    const errors = { errors: { body: "can't be blank" } };
    mockCommentsService['add'] = vi.fn().mockReturnValue(throwError(() => errors));
    component.ngOnInit();
    component.commentControl.setValue('test');
    component.addComment();
    expect(component.commentFormErrors()).toEqual(errors);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should delete a comment', () => {
    component.ngOnInit();
    component.deleteComment(mockComment);
    expect(mockCommentsService['delete']).toHaveBeenCalledWith('1', 'test-slug');
    expect(component.comments()).toEqual([]);
  });

  it('should handle errors on init', () => {
    mockArticlesService['get'] = vi.fn().mockReturnValue(throwError(() => ({ errors: { article: 'not found' } })));
    component.ngOnInit();
    expect(component.errors()).toEqual({ article: 'not found' });
  });
});
