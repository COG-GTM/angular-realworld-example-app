import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FollowButtonComponent } from './follow-button.component';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';

describe('FollowButtonComponent', () => {
  let component: FollowButtonComponent;
  let fixture: ComponentFixture<FollowButtonComponent>;
  let profileService: any;
  let router: any;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(true);
    profileService = {
      follow: vi.fn().mockReturnValue(of({ ...mockProfile, following: true })),
      unfollow: vi.fn().mockReturnValue(of({ ...mockProfile, following: false })),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [FollowButtonComponent],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: Router, useValue: router },
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
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with isSubmitting as false', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should call follow when not following', () => {
    component.profile = { ...mockProfile, following: false };
    component.toggleFollowing();
    expect(profileService.follow).toHaveBeenCalledWith('testuser');
  });

  it('should call unfollow when following', () => {
    component.profile = { ...mockProfile, following: true };
    component.toggleFollowing();
    expect(profileService.unfollow).toHaveBeenCalledWith('testuser');
  });

  it('should emit toggle event on success', () => {
    const toggleSpy = vi.spyOn(component.toggle, 'emit');
    component.profile = { ...mockProfile, following: false };
    component.toggleFollowing();
    expect(toggleSpy).toHaveBeenCalledWith({ ...mockProfile, following: true });
  });

  it('should navigate to login when not authenticated', () => {
    isAuthenticatedSubject.next(false);
    component.toggleFollowing();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set isSubmitting to false on error', () => {
    profileService.follow.mockReturnValue(throwError(() => new Error('fail')));
    component.profile = { ...mockProfile, following: false };
    component.toggleFollowing();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should set isSubmitting to false on success', () => {
    component.profile = { ...mockProfile, following: false };
    component.toggleFollowing();
    expect(component.isSubmitting()).toBe(false);
  });
});
