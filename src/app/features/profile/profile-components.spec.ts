import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject, map, of, throwError } from 'rxjs';
import { ProfileComponent } from './pages/profile/profile.component';
import ProfileArticlesComponent from './components/profile-articles.component';
import ProfileFavoritesComponent from './components/profile-favorites.component';
import { ProfileService } from './services/profile.service';
import { ArticlesService } from '../article/services/articles.service';
import { UserService } from '../../core/auth/services/user.service';
import { Profile } from './models/profile.model';
import { User } from '../../core/auth/user.model';
import profileRoutes from './profile.routes';

const mockProfile: Profile = { username: 'author1', bio: 'bio', image: '', following: false };
const mockUser: User = { email: 'a@b.c', token: 't', username: 'author1', bio: null, image: null };

describe('profile feature', () => {
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

  describe('profile.routes', () => {
    it('should define the profile child routes', () => {
      expect(profileRoutes[0].children![0].path).toBe(':username');
      expect(profileRoutes[0].children![0].children!.map(r => r.path)).toEqual(['', 'favorites']);
    });
  });

  describe('ProfileComponent', () => {
    function setup(user: User | null, error?: unknown) {
      const currentUser = new BehaviorSubject<User | null>(user);
      const profileService = {
        get: vi.fn().mockReturnValue(error ? throwError(() => error) : of(mockProfile)),
      };
      TestBed.configureTestingModule({
        imports: [ProfileComponent],
        providers: [
          provideRouter([]),
          { provide: ProfileService, useValue: profileService },
          { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
          { provide: ActivatedRoute, useValue: { snapshot: { params: { username: 'author1' } } } },
        ],
      });
      const fixture = TestBed.createComponent(ProfileComponent);
      fixture.detectChanges();
      return { fixture, component: fixture.componentInstance, profileService };
    }

    it('should load the profile and detect own profile', () => {
      const { component } = setup(mockUser);
      expect(component.profile()).toEqual(mockProfile);
      expect(component.isUser()).toBe(true);
    });

    it('should detect other user profiles', () => {
      const { component } = setup(null);
      expect(component.isUser()).toBe(false);
    });

    it('should set errors when profile loading fails', () => {
      const { component } = setup(null, { errors: { profile: ['not found'] } });
      expect(component.errors()).toEqual({ profile: ['not found'] });
    });

    it('should update profile on follow toggle', () => {
      const { component } = setup(null);
      component.onToggleFollowing({ ...mockProfile, following: true });
      expect(component.profile()!.following).toBe(true);
    });
  });

  describe('ProfileArticlesComponent', () => {
    it('should load profile and configure author filter', () => {
      const profileService = { get: vi.fn().mockReturnValue(of(mockProfile)) };
      TestBed.configureTestingModule({
        imports: [ProfileArticlesComponent],
        providers: [
          provideRouter([]),
          { provide: ProfileService, useValue: profileService },
          {
            provide: ArticlesService,
            useValue: { query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })) },
          },
          { provide: ActivatedRoute, useValue: { snapshot: { params: { username: 'author1' } } } },
        ],
      });
      const fixture = TestBed.createComponent(ProfileArticlesComponent);
      fixture.detectChanges();

      expect(profileService.get).toHaveBeenCalledWith('author1');
      const config = fixture.componentInstance.articlesConfig();
      expect(config.type).toBe('all');
      expect(config.filters.author).toBe('author1');
    });
  });

  describe('ProfileFavoritesComponent', () => {
    it('should load profile from parent route and configure favorited filter', () => {
      const profileService = { get: vi.fn().mockReturnValue(of(mockProfile)) };
      TestBed.configureTestingModule({
        imports: [ProfileFavoritesComponent],
        providers: [
          provideRouter([]),
          { provide: ProfileService, useValue: profileService },
          {
            provide: ArticlesService,
            useValue: { query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })) },
          },
          {
            provide: ActivatedRoute,
            useValue: { parent: { snapshot: { params: { username: 'author1' } } }, snapshot: { params: {} } },
          },
        ],
      });
      const fixture = TestBed.createComponent(ProfileFavoritesComponent);
      fixture.detectChanges();

      expect(profileService.get).toHaveBeenCalledWith('author1');
      const config = fixture.componentInstance.favoritesConfig();
      expect(config.type).toBe('all');
      expect(config.filters.favorited).toBe('author1');
    });
  });
});
