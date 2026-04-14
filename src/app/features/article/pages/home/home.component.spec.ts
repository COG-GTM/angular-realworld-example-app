import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import HomeComponent from './home.component';
import { TagsService } from '../../services/tags.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ArticlesService } from '../../services/articles.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: any;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;
  let paramsSubject: BehaviorSubject<any>;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    paramsSubject = new BehaviorSubject<any>({});
    queryParamsSubject = new BehaviorSubject<any>({});
    router = {
      navigate: vi.fn(),
      events: of(),
    };

    TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            queryParams: queryParamsSubject.asObservable(),
            snapshot: { queryParams: {} },
          },
        },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthenticatedSubject.asObservable(),
            currentUser: new BehaviorSubject(null).asObservable(),
            authState: new BehaviorSubject('unauthenticated').asObservable(),
          },
        },
        {
          provide: TagsService,
          useValue: {
            getAll: vi.fn().mockReturnValue(of(['tag1', 'tag2', 'tag3'])),
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with isAuthenticated as false', () => {
    expect(component.isAuthenticated()).toBe(false);
  });

  it('should have default listConfig', () => {
    expect(component.listConfig()).toEqual({ type: 'all', filters: {} });
  });

  it('should start on page 1', () => {
    expect(component.currentPage()).toBe(1);
  });

  it('should set isAuthenticated on init', () => {
    isAuthenticatedSubject.next(true);
    component.ngOnInit();
    expect(component.isAuthenticated()).toBe(true);
  });

  it('should set global feed config when no params', () => {
    component.ngOnInit();
    expect(component.listConfig()).toEqual({ type: 'all', filters: {} });
  });

  it('should set tag filter when tag param is present', () => {
    paramsSubject.next({ tag: 'angular' });
    component.ngOnInit();
    expect(component.listConfig()).toEqual({ type: 'all', filters: { tag: 'angular' } });
  });

  it('should set feed type when feed=following and authenticated', () => {
    isAuthenticatedSubject.next(true);
    queryParamsSubject.next({ feed: 'following' });
    component.ngOnInit();
    expect(component.listConfig().type).toBe('feed');
    expect(component.isFollowingFeed()).toBe(true);
  });

  it('should redirect to login when feed=following but not authenticated', () => {
    isAuthenticatedSubject.next(false);
    queryParamsSubject.next({ feed: 'following' });
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set page from query params', () => {
    queryParamsSubject.next({ page: '3' });
    component.ngOnInit();
    expect(component.currentPage()).toBe(3);
  });

  it('should default to page 1 when no page param', () => {
    queryParamsSubject.next({});
    component.ngOnInit();
    expect(component.currentPage()).toBe(1);
  });

  it('should set tagsLoaded after tags load', () => {
    expect(component.tagsLoaded()).toBe(false);
    component.tags$.subscribe(() => {
      expect(component.tagsLoaded()).toBe(true);
    });
  });
});

describe('HomeComponent - onPageChange', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: any;
  let activatedRoute: any;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;
  let paramsSubject: BehaviorSubject<any>;
  let queryParamsSubject: BehaviorSubject<any>;

  beforeEach(() => {
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    paramsSubject = new BehaviorSubject<any>({});
    queryParamsSubject = new BehaviorSubject<any>({});
    activatedRoute = {
      params: paramsSubject.asObservable(),
      queryParams: queryParamsSubject.asObservable(),
      snapshot: { queryParams: {} },
    };
    router = {
      navigate: vi.fn(),
      events: of(),
    };

    TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthenticatedSubject.asObservable(),
            currentUser: new BehaviorSubject(null).asObservable(),
            authState: new BehaviorSubject('unauthenticated').asObservable(),
          },
        },
        {
          provide: TagsService,
          useValue: {
            getAll: vi.fn().mockReturnValue(of(['tag1', 'tag2'])),
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should navigate with page param when page > 1', () => {
    component.ngOnInit();
    component.onPageChange(3);
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: { page: 3 },
    });
  });

  it('should navigate without page param when page is 1', () => {
    component.ngOnInit();
    component.onPageChange(1);
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: {},
    });
  });

  it('should preserve feed param on page change', () => {
    activatedRoute.snapshot.queryParams = { feed: 'following' };
    isAuthenticatedSubject.next(true);
    queryParamsSubject.next({ feed: 'following' });
    component.ngOnInit();
    router.navigate.mockClear();
    component.onPageChange(2);
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: { feed: 'following', page: 2 },
    });
  });
});
