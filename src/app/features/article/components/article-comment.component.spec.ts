import { initTestBed } from '../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ArticleCommentComponent } from './article-comment.component';
import { UserService } from '../../../core/auth/services/user.service';
import { User } from '../../../core/auth/user.model';
import { Comment } from '../models/comment.model';

const comment: Comment = {
  id: '1',
  body: 'nice',
  createdAt: '2020-01-01',
  author: { username: 'jane', bio: null, image: null, following: false },
};

describe('ArticleCommentComponent', () => {
  let currentUser$: BehaviorSubject<User | null>;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    TestBed.configureTestingModule({
      providers: [ArticleCommentComponent, { provide: UserService, useValue: { currentUser: currentUser$ } }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  function create(): ArticleCommentComponent {
    const component = TestBed.inject(ArticleCommentComponent);
    component.comment = comment;
    return component;
  }

  it('should create', () => {
    expect(create()).toBeTruthy();
  });

  it('should allow modifying when the current user is the comment author', async () => {
    const component = create();
    currentUser$.next({ email: 'a', token: 't', username: 'jane', bio: '', image: '' });
    expect(await firstValueFrom(component.canModify$)).toBe(true);
  });

  it('should not allow modifying for a different user', async () => {
    const component = create();
    currentUser$.next({ email: 'a', token: 't', username: 'bob', bio: '', image: '' });
    expect(await firstValueFrom(component.canModify$)).toBe(false);
  });

  it('should emit on delete', () => {
    const component = create();
    const spy = vi.fn();
    component.delete.subscribe(spy);
    component.delete.emit(true);
    expect(spy).toHaveBeenCalledWith(true);
  });
});
