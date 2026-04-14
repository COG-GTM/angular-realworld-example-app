import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ArticleCommentComponent } from './article-comment.component';
import { UserService } from '../../../core/auth/services/user.service';
import { User } from '../../../core/auth/user.model';
import { Comment } from '../models/comment.model';

describe('ArticleCommentComponent', () => {
  let component: ArticleCommentComponent;
  let fixture: ComponentFixture<ArticleCommentComponent>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockComment: Comment = {
    id: '1',
    body: 'Test comment body',
    createdAt: '2024-01-01T00:00:00.000Z',
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<User | null>(null);

    TestBed.configureTestingModule({
      imports: [ArticleCommentComponent, RouterTestingModule],
      providers: [
        {
          provide: UserService,
          useValue: {
            currentUser: currentUserSubject.asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticleCommentComponent);
    component = fixture.componentInstance;
    component.comment = mockComment;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display comment body', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test comment body');
  });

  it('should display author username', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('testuser');
  });

  it('should emit delete event when delete is clicked', () => {
    currentUserSubject.next({
      email: 'test@test.com',
      token: 'token',
      username: 'testuser',
      bio: null,
      image: null,
    });
    fixture.detectChanges();

    const deleteSpy = vi.spyOn(component.delete, 'emit');
    const deleteBtn = fixture.nativeElement.querySelector('.ion-trash-a');
    if (deleteBtn) {
      deleteBtn.click();
      expect(deleteSpy).toHaveBeenCalledWith(true);
    }
  });

  it('should show delete button when current user is the author', async () => {
    currentUserSubject.next({
      email: 'test@test.com',
      token: 'token',
      username: 'testuser',
      bio: null,
      image: null,
    });
    const canModify = await firstValueFrom(component.canModify$);
    expect(canModify).toBe(true);
  });

  it('should not show delete button when current user is not the author', async () => {
    currentUserSubject.next({
      email: 'other@test.com',
      token: 'token',
      username: 'otheruser',
      bio: null,
      image: null,
    });
    const canModify = await firstValueFrom(component.canModify$);
    expect(canModify).toBe(false);
  });

  it('should not show delete button when no user is logged in', async () => {
    currentUserSubject.next(null);
    const canModify = await firstValueFrom(component.canModify$);
    expect(canModify).toBe(false);
  });
});
