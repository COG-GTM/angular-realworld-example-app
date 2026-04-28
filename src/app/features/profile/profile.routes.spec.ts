import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll } from 'vitest';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import routes from './profile.routes';

describe('profile.routes', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  it('should export routes array', () => {
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should have a root route', () => {
    const root = routes.find(r => r.path === '');
    expect(root).toBeDefined();
  });

  it('should have :username child route', () => {
    const root = routes.find(r => r.path === '');
    const usernameRoute = root!.children!.find(r => r.path === ':username');
    expect(usernameRoute).toBeDefined();
  });

  it('should have profile articles child (default)', () => {
    const root = routes.find(r => r.path === '');
    const usernameRoute = root!.children!.find(r => r.path === ':username');
    const articlesRoute = usernameRoute!.children!.find(r => r.path === '');
    expect(articlesRoute).toBeDefined();
    expect(articlesRoute!.loadComponent).toBeDefined();
  });

  it('should have profile favorites child', () => {
    const root = routes.find(r => r.path === '');
    const usernameRoute = root!.children!.find(r => r.path === ':username');
    const favoritesRoute = usernameRoute!.children!.find(r => r.path === 'favorites');
    expect(favoritesRoute).toBeDefined();
    expect(favoritesRoute!.loadComponent).toBeDefined();
  });

  it('should have exactly 2 child routes under :username', () => {
    const root = routes.find(r => r.path === '');
    const usernameRoute = root!.children!.find(r => r.path === ':username');
    expect(usernameRoute!.children!.length).toBe(2);
  });
});
