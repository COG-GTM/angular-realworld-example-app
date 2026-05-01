import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import ProfileArticlesComponent from './profile-articles.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ProfileService } from '../services/profile.service';
import { ArticlesService } from '../../article/services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, EMPTY, of } from 'rxjs';
import { Profile } from '../models/profile.model';
import { distinctUntilChanged } from 'rxjs/operators';

describe('ProfileArticlesComponent', () => {
  let component: ProfileArticlesComponent;
  let fixture: ComponentFixture<ProfileArticlesComponent>;
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
      imports: [ProfileArticlesComponent, RouterTestingModule],
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
            snapshot: { params: { username: 'testuser' } },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ProfileArticlesComponent);
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
    expect(mockProfileService.get).toHaveBeenCalledWith('testuser');
  });

  it('should set profile after fetch', () => {
    fixture.detectChanges();
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should set articlesConfig with author filter', () => {
    fixture.detectChanges();
    const config = component.articlesConfig();
    expect(config).toBeTruthy();
    expect(config!.type).toBe('all');
    expect(config!.filters.author).toBe('testuser');
  });

  it('should have null articlesConfig before init', () => {
    expect(component.articlesConfig()).toBeNull();
  });

  it('should handle empty profile response gracefully', () => {
    mockProfileService.get.mockReturnValue(EMPTY);
    fixture.detectChanges();
    expect(component.profile()).toBeNull();
    expect(component.articlesConfig()).toBeNull();
  });
});
