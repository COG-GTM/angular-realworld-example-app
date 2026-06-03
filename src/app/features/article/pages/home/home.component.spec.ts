import { initTestBed } from '../../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import HomeComponent from './home.component';
import { UserService } from '../../../../core/auth/services/user.service';
import { TagsService } from '../../services/tags.service';

function configure(opts: {
  isAuthenticated?: boolean;
  params?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
}) {
  const isAuthenticated$ = new BehaviorSubject<boolean>(opts.isAuthenticated ?? false);
  const router = { navigate: vi.fn() };
  const route = {
    params: of(opts.params ?? {}),
    queryParams: of(opts.queryParams ?? {}),
    snapshot: { queryParams: opts.queryParams ?? {} },
  };
  TestBed.configureTestingModule({
    providers: [
      HomeComponent,
      { provide: UserService, useValue: { isAuthenticated: isAuthenticated$ } },
      { provide: TagsService, useValue: { getAll: vi.fn().mockReturnValue(of(['ng', 'rxjs'])) } },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: route },
    ],
  });
  return { component: TestBed.inject(HomeComponent), router, route };
}

describe('HomeComponent', () => {
  beforeAll(() => {
    initTestBed();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(configure({}).component).toBeTruthy();
  });

  it('should default to the global feed when unauthenticated with no params', () => {
    const { component } = configure({});
    component.ngOnInit();
    expect(component.listConfig()).toEqual({ type: 'all', filters: {} });
    expect(component.isFollowingFeed()).toBe(false);
    expect(component.currentPage()).toBe(1);
  });

  it('should filter by tag when a tag param is present', () => {
    const { component } = configure({ params: { tag: 'ng' } });
    component.ngOnInit();
    expect(component.listConfig()).toEqual({ type: 'all', filters: { tag: 'ng' } });
  });

  it('should use the following feed when authenticated with feed=following', () => {
    const { component } = configure({ isAuthenticated: true, queryParams: { feed: 'following' } });
    component.ngOnInit();
    expect(component.listConfig().type).toBe('feed');
    expect(component.isFollowingFeed()).toBe(true);
  });

  it('should redirect to login for feed=following while unauthenticated', () => {
    const { component, router } = configure({ isAuthenticated: false, queryParams: { feed: 'following' } });
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should parse the page number from query params', () => {
    const { component } = configure({ queryParams: { page: '3' } });
    component.ngOnInit();
    expect(component.currentPage()).toBe(3);
  });

  it('should navigate with no page param for page 1 on page change', () => {
    const { component, router } = configure({});
    component.onPageChange(1);
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
  });

  it('should preserve the feed param and add page for pages > 1', () => {
    const { component, router } = configure({ queryParams: { feed: 'following' } });
    component.onPageChange(2);
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { feed: 'following', page: 2 } }),
    );
  });
});
