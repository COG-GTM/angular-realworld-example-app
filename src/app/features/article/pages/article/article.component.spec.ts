import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError, map } from 'rxjs';
import ArticleComponent from './article.component';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';
import { User } from '../../../../core/auth/user.model';
import { Profile } from '../../../profile/models/profile.model';

describe('ArticleComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let component: ArticleComponent;
  let fixture: ComponentFixture<ArticleComponent>;
  let articlesService: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let commentsService: {
    getAll: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let currentUserSubject: BehaviorSubject<User | null>;
  let realRouter: Router;

  const mockAuthor: Profile = {
    username: 'author',
    bio: 'Bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  const mockArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    body: '# Hello World',
    tagList: ['test'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    favorited: false,
    favoritesCount: 5,
    author: mockAuthor,
  };

  const mockComment: Comment = {
    id: '1',
    body: 'Great article!',
    createdAt: '2024-01-01',
    author: mockAuthor,
  };

  const mockUser: User = {
    email: 'author@example.com',
    token: 'test-token',
    username: 'author',
    bio: 'Bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<User | null>(null);
    articlesService = {
      get: vi.fn().mockReturnValue(of(mockArticle)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    commentsService = {
      getAll: vi.fn().mockReturnValue(of([mockComment])),
      add: vi.fn().mockReturnValue(of({ ...mockComment, id: '2', body: 'New comment' })),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };

    TestBed.configureTestingModule({
      imports: [ArticleComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { slug: 'test-article' } } },
        },
        { provide: ArticlesService, useValue: articlesService },
        { provide: CommentsService, useValue: commentsService },
        {
          provide: UserService,
          useValue: {
            currentUser: currentUserSubject.asObservable(),
            isAuthenticated: currentUserSubject.asObservable().pipe(map((u: User | null) => !!u)),
          },
        },
      ],
    });

    realRouter = TestBed.inject(Router);
    vi.spyOn(realRouter, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should load article on init', () => {
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(articlesService.get).toHaveBeenCalledWith('test-article');
    expect(component.article()).toEqual(mockArticle);
  });

  it('should load comments on init', () => {
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(commentsService.getAll).toHaveBeenCalledWith('test-article');
    expect(component.comments()).toEqual([mockComment]);
  });

  it('should set canModify when current user is the author', () => {
    currentUserSubject.next(mockUser);
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.canModify()).toBe(true);
  });

  it('should not set canModify when current user is not the author', () => {
    currentUserSubject.next({ ...mockUser, username: 'other' });
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.canModify()).toBe(false);
  });

  it('should handle article load error', () => {
    articlesService.get.mockReturnValue(throwError(() => ({ errors: { article: 'not found' } })));
    fixture = TestBed.createComponent(ArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.errors()).toBeTruthy();
  });

  describe('deleteArticle', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArticleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should call delete and navigate home', () => {
      component.deleteArticle();
      expect(articlesService.delete).toHaveBeenCalledWith('test-article');
      expect(realRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set isDeleting', () => {
      component.deleteArticle();
      expect(component.isDeleting()).toBe(true);
    });
  });

  describe('addComment', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArticleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should add comment and prepend to list', () => {
      component.commentControl.setValue('New comment');
      component.addComment();
      expect(commentsService.add).toHaveBeenCalledWith('test-article', 'New comment');
      expect(component.comments().length).toBe(2);
      expect(component.comments()[0].body).toBe('New comment');
    });

    it('should reset comment control after adding', () => {
      component.commentControl.setValue('New comment');
      component.addComment();
      expect(component.commentControl.value).toBe('');
    });
  });

  describe('deleteComment', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArticleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should remove comment from list', () => {
      component.deleteComment(mockComment);
      expect(commentsService.delete).toHaveBeenCalledWith('1', 'test-article');
      expect(component.comments().length).toBe(0);
    });
  });

  describe('onToggleFavorite', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ArticleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should increment favoritesCount when favorited', () => {
      component.onToggleFavorite(true);
      expect(component.article()!.favorited).toBe(true);
      expect(component.article()!.favoritesCount).toBe(6);
    });

    it('should decrement favoritesCount when unfavorited', () => {
      component.onToggleFavorite(false);
      expect(component.article()!.favorited).toBe(false);
      expect(component.article()!.favoritesCount).toBe(4);
    });
  });

  describe('toggleFollowing', () => {
    it('should update author following status', () => {
      fixture = TestBed.createComponent(ArticleComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      component.toggleFollowing({ ...mockAuthor, following: true });
      expect(component.article()!.author.following).toBe(true);
    });
  });
});
