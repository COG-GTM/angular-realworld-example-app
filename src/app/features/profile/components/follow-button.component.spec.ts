import { initTestBed } from '../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FollowButtonComponent } from './follow-button.component';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';

const profile: Profile = { username: 'jane', bio: null, image: null, following: false };

describe('FollowButtonComponent', () => {
  let isAuthenticated$: BehaviorSubject<boolean>;
  let profileService: { follow: ReturnType<typeof vi.fn>; unfollow: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let component: FollowButtonComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject<boolean>(true);
    profileService = { follow: vi.fn(), unfollow: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        FollowButtonComponent,
        { provide: ProfileService, useValue: profileService },
        { provide: UserService, useValue: { isAuthenticated: isAuthenticated$ } },
        { provide: Router, useValue: router },
      ],
    });
    component = TestBed.inject(FollowButtonComponent);
    component.profile = { ...profile };
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect unauthenticated users to login', () => {
    isAuthenticated$.next(false);
    component.toggleFollowing();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(profileService.follow).not.toHaveBeenCalled();
  });

  it('should follow a profile that is not followed yet', () => {
    const updated = { ...profile, following: true };
    profileService.follow.mockReturnValue(of(updated));
    const spy = vi.fn();
    component.toggle.subscribe(spy);

    component.toggleFollowing();

    expect(profileService.follow).toHaveBeenCalledWith('jane');
    expect(spy).toHaveBeenCalledWith(updated);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should unfollow a profile that is already followed', () => {
    component.profile = { ...profile, following: true };
    const updated = { ...profile, following: false };
    profileService.unfollow.mockReturnValue(of(updated));
    const spy = vi.fn();
    component.toggle.subscribe(spy);

    component.toggleFollowing();

    expect(profileService.unfollow).toHaveBeenCalledWith('jane');
    expect(spy).toHaveBeenCalledWith(updated);
  });

  it('should reset submitting state on error', () => {
    profileService.follow.mockReturnValue(throwError(() => new Error('fail')));
    component.toggleFollowing();
    expect(component.isSubmitting()).toBe(false);
  });
});
