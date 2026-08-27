import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter, CanActivateFn, UrlTree } from '@angular/router';
import { BehaviorSubject, map, Observable, firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { UserService } from './core/auth/services/user.service';
import { User } from './core/auth/user.model';

describe('app.routes', () => {
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

  const mockUser: User = { email: 'a@b.c', token: 't', username: 'u', bio: null, image: null };

  function setup(user: User | null) {
    const currentUser = new BehaviorSubject<User | null>(user);
    const userService = { isAuthenticated: currentUser.pipe(map(u => !!u)) };
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: UserService, useValue: userService }],
    });
  }

  function runGuard(path: string, user: User | null): Promise<boolean | UrlTree> {
    setup(user);
    const route = routes.find(r => r.path === path) ?? routes.find(r => r.path === 'editor')!.children![0];
    const guard = route.canActivate![0] as CanActivateFn;
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any)) as Observable<boolean | UrlTree>;
    return firstValueFrom(result);
  }

  it('should define all top-level routes', () => {
    const paths = routes.map(r => r.path);
    expect(paths).toEqual(
      expect.arrayContaining(['', 'tag/:tag', 'login', 'register', 'settings', 'profile', 'editor', 'article/:slug']),
    );
  });

  it('should allow settings when authenticated', async () => {
    await expect(runGuard('settings', mockUser)).resolves.toBe(true);
  });

  it('should redirect settings to /login when unauthenticated', async () => {
    const result = await runGuard('settings', null);
    expect(result instanceof UrlTree && result.toString()).toBe('/login');
  });

  it('should block login page for authenticated users', async () => {
    await expect(runGuard('login', mockUser)).resolves.toBe(false);
    TestBed.resetTestingModule();
    await expect(runGuard('register', null)).resolves.toBe(true);
  });

  it('should guard editor routes', async () => {
    const editor = routes.find(r => r.path === 'editor')!;
    expect(editor.children!.length).toBe(2);
    for (const child of editor.children!) {
      expect(child.canActivate!.length).toBe(1);
    }
  });

  it('should lazy-load route components', async () => {
    for (const route of routes) {
      if (route.loadComponent) {
        const cmp = await route.loadComponent();
        expect(cmp).toBeTruthy();
      }
      if (route.loadChildren) {
        const children = await route.loadChildren();
        expect(children).toBeTruthy();
      }
    }
  });
});
