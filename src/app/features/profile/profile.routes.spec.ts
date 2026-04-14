import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import routes from './profile.routes';

describe('Profile Routes', () => {
  it('should export routes as default', () => {
    expect(routes).toBeDefined();
    expect(Array.isArray(routes)).toBe(true);
  });

  it('should have a root route with children', () => {
    const rootRoute = routes[0];
    expect(rootRoute.path).toBe('');
    expect(rootRoute.children).toBeDefined();
    expect(rootRoute.children!.length).toBe(1);
  });

  it('should have :username route with children', () => {
    const usernameRoute = routes[0].children![0];
    expect(usernameRoute.path).toBe(':username');
    expect(usernameRoute.children).toBeDefined();
    expect(usernameRoute.children!.length).toBe(2);
  });

  it('should lazy-load profile-articles component for empty path', async () => {
    const articlesRoute = routes[0].children![0].children![0];
    expect(articlesRoute.path).toBe('');
    expect(articlesRoute.loadComponent).toBeDefined();
    const module = await articlesRoute.loadComponent!();
    expect(module).toBeDefined();
  });

  it('should lazy-load profile-favorites component for favorites path', async () => {
    const favoritesRoute = routes[0].children![0].children![1];
    expect(favoritesRoute.path).toBe('favorites');
    expect(favoritesRoute.loadComponent).toBeDefined();
    const module = await favoritesRoute.loadComponent!();
    expect(module).toBeDefined();
  });
});
