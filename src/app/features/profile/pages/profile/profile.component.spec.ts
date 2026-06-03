import { initTestBed } from '../../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../../../core/auth/services/user.service';
import { ProfileService } from '../../services/profile.service';
import { User } from '../../../../core/auth/user.model';
import { Profile } from '../../models/profile.model';

const profile: Profile = { username: 'jane', bio: null, image: null, following: false };

describe('ProfileComponent', () => {
  let currentUser$: BehaviorSubject<User | null>;
  let profileService: { get: ReturnType<typeof vi.fn> };
  let component: ProfileComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    profileService = { get: vi.fn().mockReturnValue(of(profile)) };
    TestBed.configureTestingModule({
      providers: [
        ProfileComponent,
        { provide: ProfileService, useValue: profileService },
        { provide: UserService, useValue: { currentUser: currentUser$ } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { username: 'jane' } } } },
      ],
    });
    component = TestBed.inject(ProfileComponent);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the profile on init', () => {
    component.ngOnInit();
    expect(profileService.get).toHaveBeenCalledWith('jane');
    expect(component.profile()).toEqual(profile);
    expect(component.isUser()).toBe(false);
  });

  it('should flag isUser when the profile is the current user', () => {
    currentUser$.next({ email: 'a', token: 't', username: 'jane', bio: '', image: '' });
    component.ngOnInit();
    expect(component.isUser()).toBe(true);
  });

  it('should set errors when loading the profile fails', () => {
    profileService.get.mockReturnValue(throwError(() => ({ errors: { profile: ['not found'] } })));
    component.ngOnInit();
    expect(component.errors()).toEqual({ profile: ['not found'] });
  });

  it('should update the profile on follow toggle', () => {
    const updated = { ...profile, following: true };
    component.onToggleFollowing(updated);
    expect(component.profile()).toEqual(updated);
  });
});
