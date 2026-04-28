import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '../../services/profile.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { Profile } from '../../models/profile.model';
import { User } from '../../../../core/auth/user.model';
import { FollowButtonComponent } from '../../components/follow-button.component';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { DefaultImagePipe } from '../../../../shared/pipes/default-image.pipe';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-follow-button',
  template: '',
  standalone: true,
})
class MockFollowButtonComponent {
  @Input() profile!: Profile;
  @Output() toggle = new EventEmitter<Profile>();
}

@Component({
  selector: 'app-list-errors',
  template: '',
  standalone: true,
})
class MockListErrorsComponent {
  @Input() errors: any;
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let currentUserSubject: BehaviorSubject<User | null>;
  let mockProfileService: { get: ReturnType<typeof vi.fn> };

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
    following: false,
  };

  const mockUser: User = {
    email: 'test@example.com',
    token: 'fake-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    currentUserSubject = new BehaviorSubject<User | null>(null);
    mockProfileService = {
      get: vi.fn().mockReturnValue(of(mockProfile)),
    };

    TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { username: 'testuser' } },
          },
        },
        { provide: ProfileService, useValue: mockProfileService },
        {
          provide: UserService,
          useValue: { currentUser: currentUserSubject.asObservable() },
        },
      ],
    }).overrideComponent(ProfileComponent, {
      remove: { imports: [FollowButtonComponent, ListErrorsComponent, DefaultImagePipe] },
      add: { imports: [MockFollowButtonComponent, MockListErrorsComponent, DefaultImagePipe] },
    });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load profile from ProfileService', () => {
    fixture.detectChanges();
    expect(mockProfileService.get).toHaveBeenCalledWith('testuser');
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should set isUser to true when profile matches current user', () => {
    currentUserSubject.next(mockUser);
    fixture.detectChanges();
    expect(component.isUser()).toBe(true);
  });

  it('should set isUser to false when profile does not match current user', () => {
    currentUserSubject.next({ ...mockUser, username: 'otheruser' });
    fixture.detectChanges();
    expect(component.isUser()).toBe(false);
  });

  it('should set isUser to false when no user is logged in', () => {
    currentUserSubject.next(null);
    fixture.detectChanges();
    expect(component.isUser()).toBe(false);
  });

  it('should handle profile loading errors', () => {
    mockProfileService.get.mockReturnValue(throwError(() => ({ errors: { profile: ['Not found'] } })));
    fixture.detectChanges();
    expect(component.errors()).toEqual({ profile: ['Not found'] });
    expect(component.profile()).toBeNull();
  });

  it('should handle errors without errors field', () => {
    mockProfileService.get.mockReturnValue(throwError(() => ({})));
    fixture.detectChanges();
    expect(component.errors()).toEqual({ error: ['Failed to load profile'] });
  });

  it('should update profile on toggle following', () => {
    fixture.detectChanges();
    const updatedProfile: Profile = { ...mockProfile, following: true };
    component.onToggleFollowing(updatedProfile);
    expect(component.profile()).toEqual(updatedProfile);
  });

  it('should display the username in the template', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const h4 = el.querySelector('h4');
    expect(h4?.textContent?.trim()).toBe('testuser');
  });
});
