import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, map, of } from 'rxjs';
import HomeComponent from './home.component';
import { TagsService } from '../../services/tags.service';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { User } from '../../../../core/auth/user.model';

const mockUser: User = { email: 'a@b.c', token: 't', username: 'me', bio: null, image: null };

describe('HomeComponent', () => {
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

  function setup(user: User | null, params: Record<string, string> = {}, queryParams: Record<string, string> = {}) {
    const currentUser = new BehaviorSubject<User | null>(user);
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: TagsService, useValue: { getAll: vi.fn().mockReturnValue(of(['angular', 'testing'])) } },
        {
          provide: ArticlesService,
          useValue: { query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })) },
        },
        { provide: UserService, useValue: { currentUser, isAuthenticated: currentUser.pipe(map(u => !!u)) } },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of(params),
            queryParams: of(queryParams),
            snapshot: { queryParams },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(HomeComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, router };
  }

  it('should default to global feed', () => {
    const { component } = setup(null);
    expect(component.listConfig()).toEqual({ type: 'all', filters: { limit: 10, offset: 0 } });
    expect(component.isFollowingFeed()).toBe(false);
  });

  it('should filter by tag from route params', () => {
    const { component } = setup(null, { tag: 'angular' });
    expect(component.listConfig()).toEqual({ type: 'all', filters: { tag: 'angular', limit: 10, offset: 0 } });
  });

  it('should show following feed for authenticated users', () => {
    const { component } = setup(mockUser, {}, { feed: 'following' });
    expect(component.listConfig().type).toBe('feed');
    expect(component.isFollowingFeed()).toBe(true);
  });

  it('should redirect unauthenticated users away from following feed', () => {
    const { router } = setup(null, {}, { feed: 'following' });
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should read page from query params', () => {
    const { component } = setup(null, {}, { page: '3' });
    expect(component.currentPage()).toBe(3);
  });

  it('should navigate with page param on page change', () => {
    const { component, router } = setup(null);
    component.onPageChange(2);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { page: 2 } }));
  });

  it('should preserve feed param and omit page 1 on page change', () => {
    const { component, router } = setup(mockUser, {}, { feed: 'following' });
    component.onPageChange(1);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { feed: 'following' } }));
  });
});
