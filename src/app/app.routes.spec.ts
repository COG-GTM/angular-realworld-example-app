import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { routes } from './app.routes';
import { UserService } from './core/auth/services/user.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('App Routes', () => {
  it('should have routes defined', () => {
    expect(routes).toBeDefined();
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have a home route', () => {
    const homeRoute = routes.find(r => r.path === '');
    expect(homeRoute).toBeDefined();
    expect(homeRoute!.loadComponent).toBeDefined();
  });

  it('should have a tag route', () => {
    const tagRoute = routes.find(r => r.path === 'tag/:tag');
    expect(tagRoute).toBeDefined();
    expect(tagRoute!.loadComponent).toBeDefined();
  });

  it('should have a login route', () => {
    const loginRoute = routes.find(r => r.path === 'login');
    expect(loginRoute).toBeDefined();
    expect(loginRoute!.loadComponent).toBeDefined();
    expect(loginRoute!.canActivate).toBeDefined();
    expect(loginRoute!.canActivate!.length).toBe(1);
  });

  it('should have a register route', () => {
    const registerRoute = routes.find(r => r.path === 'register');
    expect(registerRoute).toBeDefined();
    expect(registerRoute!.loadComponent).toBeDefined();
    expect(registerRoute!.canActivate).toBeDefined();
  });

  it('should have a settings route with auth guard', () => {
    const settingsRoute = routes.find(r => r.path === 'settings');
    expect(settingsRoute).toBeDefined();
    expect(settingsRoute!.loadComponent).toBeDefined();
    expect(settingsRoute!.canActivate).toBeDefined();
  });

  it('should have a profile route with children', () => {
    const profileRoute = routes.find(r => r.path === 'profile');
    expect(profileRoute).toBeDefined();
    expect(profileRoute!.loadChildren).toBeDefined();
  });

  it('should have an editor route with children', () => {
    const editorRoute = routes.find(r => r.path === 'editor');
    expect(editorRoute).toBeDefined();
    expect(editorRoute!.children).toBeDefined();
    expect(editorRoute!.children!.length).toBe(2);
  });

  it('should have editor child route for new article', () => {
    const editorRoute = routes.find(r => r.path === 'editor');
    const newRoute = editorRoute!.children!.find(r => r.path === '');
    expect(newRoute).toBeDefined();
    expect(newRoute!.loadComponent).toBeDefined();
    expect(newRoute!.canActivate).toBeDefined();
  });

  it('should have editor child route for editing with slug', () => {
    const editorRoute = routes.find(r => r.path === 'editor');
    const editRoute = editorRoute!.children!.find(r => r.path === ':slug');
    expect(editRoute).toBeDefined();
    expect(editRoute!.loadComponent).toBeDefined();
    expect(editRoute!.canActivate).toBeDefined();
  });

  it('should have an article route with slug param', () => {
    const articleRoute = routes.find(r => r.path === 'article/:slug');
    expect(articleRoute).toBeDefined();
    expect(articleRoute!.loadComponent).toBeDefined();
  });
});

describe('App Routes - loadComponent/loadChildren invocations', () => {
  it('should resolve home loadComponent', async () => {
    const homeRoute = routes.find(r => r.path === '');
    const mod = await homeRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve tag route loadComponent', async () => {
    const tagRoute = routes.find(r => r.path === 'tag/:tag');
    const mod = await tagRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve login loadComponent', async () => {
    const loginRoute = routes.find(r => r.path === 'login');
    const mod = await loginRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve register loadComponent', async () => {
    const registerRoute = routes.find(r => r.path === 'register');
    const mod = await registerRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve settings loadComponent', async () => {
    const settingsRoute = routes.find(r => r.path === 'settings');
    const mod = await settingsRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve profile loadChildren', async () => {
    const profileRoute = routes.find(r => r.path === 'profile');
    const mod = await profileRoute!.loadChildren!();
    expect(mod).toBeDefined();
  });

  it('should resolve editor new article loadComponent', async () => {
    const editorRoute = routes.find(r => r.path === 'editor');
    const newRoute = editorRoute!.children!.find(r => r.path === '');
    const mod = await newRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve editor edit article loadComponent', async () => {
    const editorRoute = routes.find(r => r.path === 'editor');
    const editRoute = editorRoute!.children!.find(r => r.path === ':slug');
    const mod = await editRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });

  it('should resolve article detail loadComponent', async () => {
    const articleRoute = routes.find(r => r.path === 'article/:slug');
    const mod = await articleRoute!.loadComponent!();
    expect(mod).toBeDefined();
  });
});

describe('App Routes - requireAuth guard', () => {
  let isAuthSubject: BehaviorSubject<boolean>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    isAuthSubject = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),

        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthSubject.asObservable(),
            currentUser: new BehaviorSubject(null).asObservable(),
            authState: new BehaviorSubject('loading').asObservable(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should navigate to settings when authenticated', async () => {
    isAuthSubject.next(true);
    const router = TestBed.inject(Router);
    const navigated = await router.navigateByUrl('/settings');
    expect(navigated).toBe(true);
  });

  it('should redirect to /login when not authenticated for settings', async () => {
    isAuthSubject.next(false);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/settings');
    expect(router.url).toBe('/login');
  });

  it('should allow /login when not authenticated', async () => {
    isAuthSubject.next(false);
    const router = TestBed.inject(Router);
    const navigated = await router.navigateByUrl('/login');
    expect(navigated).toBe(true);
  });

  it('should block /login when authenticated', async () => {
    isAuthSubject.next(true);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    expect(router.url).not.toBe('/login');
  });

  it('should block /register when authenticated', async () => {
    isAuthSubject.next(true);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/register');
    expect(router.url).not.toBe('/register');
  });

  it('should redirect to /login when not authenticated for editor', async () => {
    isAuthSubject.next(false);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/editor');
    expect(router.url).toBe('/login');
  });
});
