import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '../../services/profile.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Profile } from '../../models/profile.model';
import { User } from '../../../../core/auth/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let profileService: any;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  const mockUser: User = {
    email: 'test@test.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);
    profileService = {
      get: vi.fn().mockReturnValue(of(mockProfile)),
    };

    TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: UserService,
          useValue: {
            currentUser: currentUserSubject.asObservable(),
            isAuthenticated: new BehaviorSubject(true).asObservable(),
            authState: new BehaviorSubject('authenticated').asObservable(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { username: 'testuser' } },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with null profile', () => {
    expect(component.profile()).toBeNull();
  });

  it('should start with isUser as false', () => {
    expect(component.isUser()).toBe(false);
  });

  it('should load profile on init', () => {
    component.ngOnInit();
    expect(profileService.get).toHaveBeenCalledWith('testuser');
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should set isUser to true when profile is current user', () => {
    component.ngOnInit();
    expect(component.isUser()).toBe(true);
  });

  it('should set isUser to false when profile is different user', () => {
    currentUserSubject.next({ ...mockUser, username: 'otheruser' });
    component.ngOnInit();
    expect(component.isUser()).toBe(false);
  });

  it('should handle profile load error', () => {
    profileService.get.mockReturnValue(throwError(() => ({ errors: { profile: 'not found' } })));
    component.ngOnInit();
    expect(component.errors()).toBeTruthy();
  });

  it('should handle profile load error without errors property', () => {
    profileService.get.mockReturnValue(throwError(() => ({})));
    component.ngOnInit();
    expect(component.errors()).toBeTruthy();
  });

  it('should update profile on toggle following', () => {
    component.ngOnInit();
    const updatedProfile: Profile = { ...mockProfile, following: true };
    component.onToggleFollowing(updatedProfile);
    expect(component.profile()).toEqual(updatedProfile);
  });
});
