import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { Component } from '@angular/core';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '../../services/profile.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { User } from '../../../../core/auth/user.model';
import { Profile } from '../../models/profile.model';

@Component({ template: '' })
class ChildStub {}

describe('ProfileComponent tabs', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  const ana = { username: 'ana', email: 'ana@example.com', token: 't', bio: null, image: null } as unknown as User;
  let currentUser: BehaviorSubject<User | null>;

  beforeEach(() => {
    currentUser = new BehaviorSubject<User | null>(ana);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'profile/:username',
            component: ProfileComponent,
            children: [
              { path: '', component: ChildStub },
              { path: 'favorites', component: ChildStub },
              { path: 'reading-list', component: ChildStub },
            ],
          },
        ]),
        {
          provide: ProfileService,
          useValue: {
            get: (username: string) => of<Profile>({ username, bio: null, image: '', following: false }),
          },
        },
        { provide: UserService, useValue: { currentUser, isAuthenticated: of(true) } },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  const tabLabels = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.articles-toggle .nav-link')).map(a => a.textContent?.trim());

  it('shows the Reading list tab on your own profile', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana');
    harness.detectChanges();

    const el = harness.routeNativeElement!;
    expect(tabLabels(el)).toEqual(['My Posts', 'Favorited Posts', 'Reading list']);
    const link = Array.from(el.querySelectorAll('.articles-toggle .nav-link')).find(
      a => a.textContent?.trim() === 'Reading list',
    );
    expect(link?.getAttribute('href')).toBe('/profile/ana/reading-list');
  });

  it("hides the Reading list tab on another user's profile", async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/eric');
    harness.detectChanges();

    expect(tabLabels(harness.routeNativeElement!)).toEqual(['My Posts', 'Favorited Posts']);
  });

  it('hides the Reading list tab for anonymous visitors', async () => {
    currentUser.next(null);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/profile/ana');
    harness.detectChanges();

    expect(tabLabels(harness.routeNativeElement!)).toEqual(['My Posts', 'Favorited Posts']);
  });
});
