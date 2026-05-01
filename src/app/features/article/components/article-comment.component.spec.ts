import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ArticleCommentComponent } from './article-comment.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from '../../../core/auth/services/user.service';
import { BehaviorSubject } from 'rxjs';
import { User } from '../../../core/auth/user.model';
import { Comment } from '../models/comment.model';
import { By } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ArticleCommentComponent', () => {
  let component: ArticleCommentComponent;
  let fixture: ComponentFixture<ArticleCommentComponent>;
  let userSubject: BehaviorSubject<User | null>;

  const mockComment: Comment = {
    id: '1',
    body: 'This is a test comment',
    createdAt: '2024-01-01T00:00:00.000Z',
    author: {
      username: 'commentauthor',
      bio: 'bio',
      image: 'http://example.com/avatar.png',
      following: false,
    },
  };

  const mockUser: User = {
    email: 'test@test.com',
    token: 'token',
    username: 'commentauthor',
    bio: null,
    image: null,
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    userSubject = new BehaviorSubject<User | null>(null);

    TestBed.configureTestingModule({
      imports: [ArticleCommentComponent, RouterTestingModule],
      providers: [
        {
          provide: UserService,
          useValue: {
            currentUser: userSubject.asObservable().pipe(distinctUntilChanged()),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ArticleCommentComponent);
    component = fixture.componentInstance;
    component.comment = { ...mockComment };
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render the comment body', () => {
    const cardText = fixture.debugElement.query(By.css('.card-text'));
    expect(cardText).toBeTruthy();
    expect(cardText.nativeElement.textContent).toContain('This is a test comment');
  });

  it('should render author username', () => {
    const authorLinks = fixture.debugElement.queryAll(By.css('.comment-author'));
    const usernameLink = authorLinks.find(el => el.nativeElement.textContent.includes('commentauthor'));
    expect(usernameLink).toBeTruthy();
  });

  it('should render author avatar', () => {
    const img = fixture.debugElement.query(By.css('.comment-author-img'));
    expect(img).toBeTruthy();
  });

  it('should render the date', () => {
    const dateEl = fixture.debugElement.query(By.css('.date-posted'));
    expect(dateEl).toBeTruthy();
    expect(dateEl.nativeElement.textContent.trim().length).toBeGreaterThan(0);
  });

  describe('delete button visibility', () => {
    it('should not show delete button when user is not the author', () => {
      userSubject.next({ ...mockUser, username: 'otheruser' });
      fixture.detectChanges();
      const deleteBtn = fixture.debugElement.query(By.css('.ion-trash-a'));
      expect(deleteBtn).toBeFalsy();
    });

    it('should show delete button when user is the author', () => {
      userSubject.next(mockUser);
      fixture.detectChanges();
      const deleteBtn = fixture.debugElement.query(By.css('.ion-trash-a'));
      expect(deleteBtn).toBeTruthy();
    });

    it('should emit delete event when delete button clicked', () => {
      userSubject.next(mockUser);
      fixture.detectChanges();
      const deleteSpy = vi.fn();
      component.delete.subscribe(deleteSpy);
      const deleteBtn = fixture.debugElement.query(By.css('.ion-trash-a'));
      deleteBtn.triggerEventHandler('click', null);
      expect(deleteSpy).toHaveBeenCalledWith(true);
    });
  });
});
