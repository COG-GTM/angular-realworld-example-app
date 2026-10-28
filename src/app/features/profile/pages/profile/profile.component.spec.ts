import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '../../services/profile.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { User } from '../../../../core/auth/user.model';
import { Profile } from '../../models/profile.model';

describe('ProfileComponent tabs', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized by test-setup
    }
  });

  const ana: User = { email: 'ana@example.com', token: 't', username: 'ana', bio: null, image: null };
  const profileOf = (username: string): Profile => ({ username, bio: null, image: null, following: false });

  let fixture: ComponentFixture<ProfileComponent>;
  let paramMap: BehaviorSubject<ParamMap>;
  let currentUser: BehaviorSubject<User | null>;

  const tabs = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.nav-link')).map(a => a.textContent?.trim());

  beforeEach(() => {
    paramMap = new BehaviorSubject(convertToParamMap({ username: 'ana' }));
    currentUser = new BehaviorSubject<User | null>(ana);
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap, snapshot: { params: {} } } },
        { provide: ProfileService, useValue: { get: vi.fn((u: string) => of(profileOf(u))) } },
        { provide: UserService, useValue: { currentUser } },
      ],
    });
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows the Reading list tab on the signed-in user’s own profile', () => {
    expect(tabs()).toEqual(['My Articles', 'Favorited Articles', 'Reading list']);
    const link = (fixture.nativeElement as HTMLElement).querySelector('.reading-list-tab');
    expect(link?.getAttribute('href')).toBe('/profile/ana/reading-list');
  });

  it('hides the Reading list tab on other users’ profiles, including when the route is reused', () => {
    paramMap.next(convertToParamMap({ username: 'eric' }));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h4')?.textContent).toBe('eric');
    expect(tabs()).toEqual(['My Articles', 'Favorited Articles']);
  });

  it('hides the Reading list tab for anonymous visitors', () => {
    currentUser.next(null);
    fixture.detectChanges();
    expect(tabs()).not.toContain('Reading list');
  });
});
