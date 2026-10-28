import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { BehaviorSubject, isObservable, Observable } from 'rxjs';
import { readingListGuard } from './reading-list.guard';
import { AuthState, UserService } from '../../core/auth/services/user.service';
import { User } from '../../core/auth/user.model';

describe('readingListGuard', () => {
  beforeAll(() => {
    try {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    } catch {
      // already initialized by test-setup
    }
  });

  const ana: User = { email: 'ana@example.com', token: 't', username: 'ana', bio: null, image: null };
  let authState: BehaviorSubject<AuthState>;
  let currentUser: BehaviorSubject<User | null>;

  beforeEach(() => {
    authState = new BehaviorSubject<AuthState>('authenticated');
    currentUser = new BehaviorSubject<User | null>(ana);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: { authState: authState.asObservable(), currentUser: currentUser.asObservable() },
        },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  function run(username: string): Observable<boolean | UrlTree> {
    const route = { params: {}, parent: { params: { username } } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => readingListGuard(route, {} as RouterStateSnapshot));
    if (!isObservable(result)) throw new Error('guard should return an observable');
    return result as Observable<boolean | UrlTree>;
  }

  function collect(username: string): (boolean | string)[] {
    const router = TestBed.inject(Router);
    const values: (boolean | string)[] = [];
    run(username).subscribe(v => values.push(typeof v === 'boolean' ? v : router.serializeUrl(v)));
    return values;
  }

  it('allows the owner of the profile', () => {
    expect(collect('ana')).toEqual([true]);
  });

  it('redirects another user’s reading list to that user’s profile', () => {
    expect(collect('eric')).toEqual(['/profile/eric']);
  });

  it('redirects anonymous users to /login', () => {
    authState.next('unauthenticated');
    currentUser.next(null);
    expect(collect('ana')).toEqual(['/login']);
  });

  it('waits for auth loading to finish before deciding (direct reload)', () => {
    authState.next('loading');
    currentUser.next(null);
    const values = collect('ana');
    expect(values).toEqual([]);

    currentUser.next(ana);
    authState.next('authenticated');
    expect(values).toEqual([true]);
  });

  it('does not grant access when auth is unavailable', () => {
    authState.next('unavailable');
    currentUser.next(null);
    expect(collect('ana')).toEqual(['/profile/ana']);
  });
});
