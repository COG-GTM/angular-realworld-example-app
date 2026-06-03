import { initTestBed } from '../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import ProfileFavoritesComponent from './profile-favorites.component';
import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';

const profile: Profile = { username: 'jane', bio: null, image: null, following: false };

describe('ProfileFavoritesComponent', () => {
  let profileService: { get: ReturnType<typeof vi.fn> };
  let component: ProfileFavoritesComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    profileService = { get: vi.fn().mockReturnValue(of(profile)) };
    TestBed.configureTestingModule({
      providers: [
        ProfileFavoritesComponent,
        { provide: ProfileService, useValue: profileService },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { username: 'jane' } } } } },
      ],
    });
    component = TestBed.inject(ProfileFavoritesComponent);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the parent profile and build a "favorited" articles config on init', () => {
    component.ngOnInit();
    expect(profileService.get).toHaveBeenCalledWith('jane');
    expect(component.profile()).toEqual(profile);
    expect(component.favoritesConfig()).toEqual({ type: 'all', filters: { favorited: 'jane' } });
  });
});
