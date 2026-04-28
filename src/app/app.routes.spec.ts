import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { routes } from './app.routes';

describe('app.routes', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  it('should define the root route', () => {
    const root = routes.find(r => r.path === '');
    expect(root).toBeDefined();
    expect(root!.loadComponent).toBeDefined();
  });

  it('should define the tag route', () => {
    const tag = routes.find(r => r.path === 'tag/:tag');
    expect(tag).toBeDefined();
    expect(tag!.loadComponent).toBeDefined();
  });

  it('should define the login route with canActivate', () => {
    const login = routes.find(r => r.path === 'login');
    expect(login).toBeDefined();
    expect(login!.canActivate).toBeDefined();
    expect(login!.canActivate!.length).toBe(1);
  });

  it('should define the register route with canActivate', () => {
    const register = routes.find(r => r.path === 'register');
    expect(register).toBeDefined();
    expect(register!.canActivate).toBeDefined();
    expect(register!.canActivate!.length).toBe(1);
  });

  it('should define the settings route with canActivate', () => {
    const settings = routes.find(r => r.path === 'settings');
    expect(settings).toBeDefined();
    expect(settings!.canActivate).toBeDefined();
    expect(settings!.canActivate!.length).toBe(1);
  });

  it('should define the profile route with loadChildren', () => {
    const profile = routes.find(r => r.path === 'profile');
    expect(profile).toBeDefined();
    expect(profile!.loadChildren).toBeDefined();
  });

  it('should define the editor route with children', () => {
    const editor = routes.find(r => r.path === 'editor');
    expect(editor).toBeDefined();
    expect(editor!.children).toBeDefined();
    expect(editor!.children!.length).toBe(2);
  });

  it('should define editor child routes with canActivate', () => {
    const editor = routes.find(r => r.path === 'editor');
    const newEditor = editor!.children!.find(r => r.path === '');
    const editEditor = editor!.children!.find(r => r.path === ':slug');
    expect(newEditor!.canActivate).toBeDefined();
    expect(editEditor!.canActivate).toBeDefined();
  });

  it('should define the article route', () => {
    const article = routes.find(r => r.path === 'article/:slug');
    expect(article).toBeDefined();
    expect(article!.loadComponent).toBeDefined();
  });

  it('should not require auth for home, tag, or article routes', () => {
    const home = routes.find(r => r.path === '');
    const tag = routes.find(r => r.path === 'tag/:tag');
    const article = routes.find(r => r.path === 'article/:slug');
    expect(home!.canActivate).toBeUndefined();
    expect(tag!.canActivate).toBeUndefined();
    expect(article!.canActivate).toBeUndefined();
  });

  it('should have exactly the expected number of top-level routes', () => {
    expect(routes.length).toBe(8);
  });
});
