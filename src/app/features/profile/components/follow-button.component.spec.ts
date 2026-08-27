import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, map, of, throwError } from 'rxjs';
import { FollowButtonComponent } from './follow-button.component';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';
import { User } from '../../../core/auth/user.model';

const mockProfile: Profile = { username: 'author1', bio: '', image: '', following: false };
const mockUser: User = { email: 'a@b.c', token: 't', username: 'me', bio: null, image: null };

describe('FollowButtonComponent', () => {
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

  function setup(user: User | null, profile: Partial<Profile> = {}) {
    const currentUser = new BehaviorSubject<User | null>(user);
    const profileService = {
      follow: vi.fn().mockReturnValue(of({ ...mockProfile, following: true })),
      unfollow: vi.fn().mockReturnValue(of({ ...mockProfile, following: false })),
    };
    TestBed.configureTestingModule({
      imports: [FollowButtonComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: profileService },
        { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
      ],
    });
    const fixture = TestBed.createComponent(FollowButtonComponent);
    fixture.componentInstance.profile = { ...mockProfile, ...profile };
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, profileService, router };
  }

  it('should render Follow label when not following', () => {
    const { fixture } = setup(null);
    expect(fixture.nativeElement.textContent).toContain('Follow author1');
  });

  it('should render Unfollow label when following', () => {
    const { fixture } = setup(null, { following: true });
    expect(fixture.nativeElement.textContent).toContain('Unfollow author1');
  });

  it('should redirect to login when unauthenticated', () => {
    const { component, router, profileService } = setup(null);
    component.toggleFollowing();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(profileService.follow).not.toHaveBeenCalled();
  });

  it('should follow and emit updated profile', () => {
    const { component, profileService } = setup(mockUser);
    const toggleSpy = vi.fn();
    component.toggle.subscribe(toggleSpy);

    component.toggleFollowing();

    expect(profileService.follow).toHaveBeenCalledWith('author1');
    expect(toggleSpy).toHaveBeenCalledWith(expect.objectContaining({ following: true }));
    expect(component.isSubmitting()).toBe(false);
  });

  it('should unfollow when already following', () => {
    const { component, profileService } = setup(mockUser, { following: true });
    component.toggleFollowing();
    expect(profileService.unfollow).toHaveBeenCalledWith('author1');
  });

  it('should reset submitting state on error', () => {
    const { component, profileService } = setup(mockUser);
    profileService.follow.mockReturnValue(throwError(() => new Error('fail')));

    component.toggleFollowing();

    expect(component.isSubmitting()).toBe(false);
  });
});
