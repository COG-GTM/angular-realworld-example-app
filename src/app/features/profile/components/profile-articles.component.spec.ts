import { initTestBed } from '../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import ProfileArticlesComponent from './profile-articles.component';
import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile.model';

const profile: Profile = { username: 'jane', bio: null, image: null, following: false };

describe('ProfileArticlesComponent', () => {
  let profileService: { get: ReturnType<typeof vi.fn> };
  let component: ProfileArticlesComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    profileService = { get: vi.fn().mockReturnValue(of(profile)) };
    TestBed.configureTestingModule({
      providers: [
        ProfileArticlesComponent,
        { provide: ProfileService, useValue: profileService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { username: 'jane' } } } },
      ],
    });
    component = TestBed.inject(ProfileArticlesComponent);
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the profile and build an "author" articles config on init', () => {
    component.ngOnInit();
    expect(profileService.get).toHaveBeenCalledWith('jane');
    expect(component.profile()).toEqual(profile);
    expect(component.articlesConfig()).toEqual({ type: 'all', filters: { author: 'jane' } });
  });
});
