import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import ProfileFavoritesComponent from './profile-favorites.component';
import { ProfileService } from '../services/profile.service';
import { ArticlesService } from '../../article/services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Profile } from '../models/profile.model';

describe('ProfileFavoritesComponent', () => {
  let component: ProfileFavoritesComponent;
  let fixture: ComponentFixture<ProfileFavoritesComponent>;
  let profileService: any;

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
    profileService = {
      get: vi.fn().mockReturnValue(of(mockProfile)),
    };

    TestBed.configureTestingModule({
      imports: [ProfileFavoritesComponent, RouterTestingModule],
      providers: [
        { provide: ProfileService, useValue: profileService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { username: 'testuser' } },
            parent: {
              snapshot: { params: { username: 'testuser' } },
            },
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })),
          },
        },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: new BehaviorSubject(false).asObservable(),
            currentUser: new BehaviorSubject(null).asObservable(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ProfileFavoritesComponent);
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

  it('should start with null favoritesConfig', () => {
    expect(component.favoritesConfig()).toBeNull();
  });

  it('should load profile on init', () => {
    component.ngOnInit();
    expect(profileService.get).toHaveBeenCalledWith('testuser');
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should set favoritesConfig with favorited filter on init', () => {
    component.ngOnInit();
    expect(component.favoritesConfig()).toEqual({
      type: 'all',
      filters: { favorited: 'testuser' },
    });
  });
});
