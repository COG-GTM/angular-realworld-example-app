import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ProfileComponent } from './profile.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ProfileService } from '../../services/profile.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Profile } from '../../models/profile.model';
import { User } from '../../../../core/auth/user.model';
import { By } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockProfileService: {
    get: ReturnType<typeof vi.fn>;
    follow: ReturnType<typeof vi.fn>;
    unfollow: ReturnType<typeof vi.fn>;
  };
  let userSubject: BehaviorSubject<User | null>;

  const mockProfile: Profile = {
    username: 'johndoe',
    bio: 'A developer',
    image: 'http://example.com/avatar.png',
    following: false,
  };

  const mockUser: User = {
    email: 'john@example.com',
    token: 'test-token',
    username: 'johndoe',
    bio: 'A developer',
    image: 'http://example.com/avatar.png',
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    mockProfileService = {
      get: vi.fn().mockReturnValue(of(mockProfile)),
      follow: vi.fn(),
      unfollow: vi.fn(),
    };
    userSubject = new BehaviorSubject<User | null>(mockUser);

    TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        {
          provide: UserService,
          useValue: {
            currentUser: userSubject.asObservable().pipe(distinctUntilChanged()),
            isAuthenticated: userSubject.asObservable().pipe(distinctUntilChanged()),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { username: 'johndoe' } },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch profile on init', () => {
    fixture.detectChanges();
    expect(mockProfileService.get).toHaveBeenCalledWith('johndoe');
  });

  it('should set profile after fetch', () => {
    fixture.detectChanges();
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should detect when profile is current user', () => {
    fixture.detectChanges();
    expect(component.isUser()).toBe(true);
  });

  it('should detect when profile is not current user', () => {
    mockProfileService.get.mockReturnValue(of({ ...mockProfile, username: 'otheruser' }));
    fixture.detectChanges();
    expect(component.isUser()).toBe(false);
  });

  it('should display username in template', () => {
    fixture.detectChanges();
    const heading = fixture.debugElement.query(By.css('h4'));
    expect(heading.nativeElement.textContent.trim()).toBe('johndoe');
  });

  it('should display user avatar', () => {
    fixture.detectChanges();
    const img = fixture.debugElement.query(By.css('.user-img'));
    expect(img).toBeTruthy();
  });

  it('should show Edit Profile Settings for own profile', () => {
    fixture.detectChanges();
    const settingsLink = fixture.debugElement.query(By.css('a.btn'));
    expect(settingsLink.nativeElement.textContent).toContain('Edit Profile Settings');
  });

  it('should show follow button for other user profile', () => {
    mockProfileService.get.mockReturnValue(of({ ...mockProfile, username: 'otheruser' }));
    fixture.detectChanges();
    const followBtn = fixture.debugElement.query(By.css('app-follow-button'));
    expect(followBtn).toBeTruthy();
  });

  it('should update profile on toggle following', () => {
    fixture.detectChanges();
    const updatedProfile = { ...mockProfile, following: true };
    component.onToggleFollowing(updatedProfile);
    expect(component.profile()).toEqual(updatedProfile);
  });

  it('should set errors on profile fetch error', () => {
    mockProfileService.get.mockReturnValue(throwError(() => ({ errors: { profile: ['not found'] } })));
    fixture.detectChanges();
    expect(component.errors()).toEqual({ profile: ['not found'] });
  });

  it('should set fallback error message when error has no errors property', () => {
    mockProfileService.get.mockReturnValue(throwError(() => ({})));
    fixture.detectChanges();
    expect(component.errors()).toEqual({ error: ['Failed to load profile'] });
  });
});
