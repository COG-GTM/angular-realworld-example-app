import { initTestBed } from '../../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import ArticleComponent from './article.component';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { User } from '../../../../core/auth/user.model';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';

const article: Article = {
  slug: 'my-slug',
  title: 'T',
  description: 'D',
  body: 'B',
  tagList: [],
  createdAt: '',
  updatedAt: '',
  favorited: false,
  favoritesCount: 2,
  author: { username: 'jane', bio: null, image: null, following: false },
};

const comment: Comment = {
  id: '1',
  body: 'nice',
  createdAt: '',
  author: { username: 'bob', bio: null, image: null, following: false },
};

describe('ArticleComponent', () => {
  let currentUser$: BehaviorSubject<User | null>;
  let articleService: { get: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let commentsService: {
    getAll: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let component: ArticleComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    articleService = { get: vi.fn().mockReturnValue(of(article)), delete: vi.fn().mockReturnValue(of(undefined)) };
    commentsService = {
      getAll: vi.fn().mockReturnValue(of([comment])),
      add: vi.fn(),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ArticleComponent,
        { provide: ArticlesService, useValue: articleService },
        { provide: CommentsService, useValue: commentsService },
        { provide: UserService, useValue: { currentUser: currentUser$ } },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { slug: 'my-slug' } } } },
      ],
    });
    component = TestBed.inject(ArticleComponent);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the article, comments and current user on init', () => {
    component.ngOnInit();
    expect(component.article()).toEqual(article);
    expect(component.comments()).toEqual([comment]);
    expect(component.canModify()).toBe(false);
  });

  it('should set canModify when the current user is the author', () => {
    currentUser$.next({ email: 'a', token: 't', username: 'jane', bio: '', image: '' });
    component.ngOnInit();
    expect(component.canModify()).toBe(true);
  });

  it('should set errors when loading fails', () => {
    articleService.get.mockReturnValue(throwError(() => ({ errors: { article: ['missing'] } })));
    component.ngOnInit();
    expect(component.errors()).toEqual({ article: ['missing'] });
  });

  it('should adjust favoritesCount on favorite toggle', () => {
    component.ngOnInit();
    component.onToggleFavorite(true);
    expect(component.article()!.favorited).toBe(true);
    expect(component.article()!.favoritesCount).toBe(3);
    component.onToggleFavorite(false);
    expect(component.article()!.favoritesCount).toBe(2);
  });

  it('should update the author following state on toggleFollowing', () => {
    component.ngOnInit();
    component.toggleFollowing({ ...article.author, following: true });
    expect(component.article()!.author.following).toBe(true);
  });

  it('should delete the article and navigate home', () => {
    component.ngOnInit();
    component.deleteArticle();
    expect(articleService.delete).toHaveBeenCalledWith('my-slug');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should add a comment and prepend it to the list', () => {
    component.ngOnInit();
    const newComment: Comment = { ...comment, id: '2', body: 'great' };
    commentsService.add.mockReturnValue(of(newComment));
    component.commentControl.setValue('great');
    component.addComment();
    expect(commentsService.add).toHaveBeenCalledWith('my-slug', 'great');
    expect(component.comments()[0]).toEqual(newComment);
    expect(component.commentControl.value).toBe('');
  });

  it('should surface comment form errors on add failure', () => {
    component.ngOnInit();
    commentsService.add.mockReturnValue(throwError(() => ({ errors: { body: ['blank'] } })));
    component.addComment();
    expect(component.commentFormErrors()).toEqual({ errors: { body: ['blank'] } });
    expect(component.isSubmitting()).toBe(false);
  });

  it('should delete a comment from the list', () => {
    component.ngOnInit();
    component.deleteComment(comment);
    expect(commentsService.delete).toHaveBeenCalledWith('1', 'my-slug');
    expect(component.comments()).toEqual([]);
  });

  it('should surface delete-comment errors on failure', () => {
    component.ngOnInit();
    commentsService.delete.mockReturnValue(throwError(() => ({ errors: { comment: ['nope'] } })));
    component.deleteComment(comment);
    expect(component.deleteCommentErrors()).toEqual({ errors: { comment: ['nope'] } });
  });
});
