import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import ProfileFavoritesComponent from './profile-favorites.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ProfileService } from '../services/profile.service';
import { ArticlesService } from '../../article/services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, EMPTY, of } from 'rxjs';
import { Profile } from '../models/profile.model';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ProfileFavoritesComponent', () => {
  let component: ProfileFavoritesComponent;
  let fixture: ComponentFixture<ProfileFavoritesComponent>;
  let mockProfileService: { get: ReturnType<typeof vi.fn> };

  const mockProfile: Profile = {
    username: 'testuser',
    bio: 'A test user',
    image: 'http://example.com/avatar.png',
    following: false,
  };

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    mockProfileService = {
      get: vi.fn().mockReturnValue(of(mockProfile)),
    };

    TestBed.configureTestingModule({
      imports: [ProfileFavoritesComponent, RouterTestingModule],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        {
          provide: ArticlesService,
          useValue: { query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })) },
        },
        {
          provide: UserService,
          useValue: {
            currentUser: new BehaviorSubject(null).asObservable().pipe(distinctUntilChanged()),
            isAuthenticated: new BehaviorSubject(false).asObservable(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { snapshot: { params: { username: 'testuser' } } },
            snapshot: { params: {} },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ProfileFavoritesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch profile from parent route username on init', () => {
    fixture.detectChanges();
    expect(mockProfileService.get).toHaveBeenCalledWith('testuser');
  });

  it('should set profile after fetch', () => {
    fixture.detectChanges();
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should set favoritesConfig with favorited filter', () => {
    fixture.detectChanges();
    const config = component.favoritesConfig();
    expect(config).toBeTruthy();
    expect(config!.type).toBe('all');
    expect(config!.filters.favorited).toBe('testuser');
  });

  it('should have null favoritesConfig before init', () => {
    expect(component.favoritesConfig()).toBeNull();
  });

  it('should handle empty profile response gracefully', () => {
    mockProfileService.get.mockReturnValue(EMPTY);
    fixture.detectChanges();
    expect(component.profile()).toBeNull();
    expect(component.favoritesConfig()).toBeNull();
  });
});
