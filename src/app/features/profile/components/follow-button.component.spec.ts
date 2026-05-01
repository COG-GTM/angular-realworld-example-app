import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FollowButtonComponent } from './follow-button.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Profile } from '../models/profile.model';
import { By } from '@angular/platform-browser';

describe('FollowButtonComponent', () => {
  let component: FollowButtonComponent;
  let fixture: ComponentFixture<FollowButtonComponent>;
  let mockProfileService: { follow: ReturnType<typeof vi.fn>; unfollow: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'test bio',
    image: 'http://example.com/avatar.png',
    following: false,
  };

  const followedProfile: Profile = { ...mockProfile, following: true };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(true);
    mockProfileService = {
      follow: vi.fn().mockReturnValue(of(followedProfile)),
      unfollow: vi.fn().mockReturnValue(of(mockProfile)),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [FollowButtonComponent, RouterTestingModule],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: Router, useValue: mockRouter },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthenticatedSubject.asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(FollowButtonComponent);
    component = fixture.componentInstance;
    component.profile = { ...mockProfile };
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should render a button', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button).toBeTruthy();
  });

  it('should show Follow text when not following', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent).toContain('Follow');
    expect(button.nativeElement.textContent).toContain('testuser');
  });

  it('should show Unfollow text when following', () => {
    fixture.componentRef.setInput('profile', { ...mockProfile, following: true });
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.textContent).toContain('Unfollow');
  });

  it('should have btn-outline-secondary when not following', () => {
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.classList).toContain('btn-outline-secondary');
  });

  it('should have btn-secondary when following', () => {
    fixture.componentRef.setInput('profile', { ...mockProfile, following: true });
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.classList).toContain('btn-secondary');
  });

  it('should call follow service when not following', () => {
    component.toggleFollowing();
    expect(mockProfileService.follow).toHaveBeenCalledWith('testuser');
  });

  it('should call unfollow service when following', () => {
    fixture.componentRef.setInput('profile', { ...mockProfile, following: true });
    fixture.detectChanges();
    component.toggleFollowing();
    expect(mockProfileService.unfollow).toHaveBeenCalledWith('testuser');
  });

  it('should emit toggle event with profile on success', () => {
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);
    component.toggleFollowing();
    expect(toggleSpy).toHaveBeenCalledWith(followedProfile);
  });

  it('should redirect unauthenticated user to /login', () => {
    isAuthenticatedSubject.next(false);
    component.toggleFollowing();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should reset isSubmitting on error', () => {
    mockProfileService.follow.mockReturnValue(throwError(() => new Error('fail')));
    component.toggleFollowing();
    expect(component.isSubmitting()).toBe(false);
  });
});
