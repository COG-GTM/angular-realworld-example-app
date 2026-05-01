import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import HomeComponent from './home.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TagsService } from '../../services/tags.service';
import { ArticlesService } from '../../services/articles.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { BehaviorSubject, of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;
  let paramsSubject: BehaviorSubject<Record<string, string>>;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    paramsSubject = new BehaviorSubject<Record<string, string>>({});
    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            queryParams: queryParamsSubject.asObservable(),
            snapshot: { queryParams: {} },
          },
        },
        {
          provide: TagsService,
          useValue: { getAll: vi.fn().mockReturnValue(of(['angular', 'react', 'vue'])) },
        },
        {
          provide: ArticlesService,
          useValue: { query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })) },
        },
        {
          provide: UserService,
          useValue: {
            currentUser: new BehaviorSubject(null).asObservable().pipe(distinctUntilChanged()),
            isAuthenticated: isAuthenticatedSubject.asObservable(),
          },
        },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should default to global feed config', () => {
    fixture.detectChanges();
    const config = component.listConfig();
    expect(config.type).toBe('all');
    expect(config.filters.tag).toBeUndefined();
    expect(config.filters.author).toBeUndefined();
  });

  it('should set isAuthenticated based on user state', () => {
    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    expect(component.isAuthenticated()).toBe(true);
  });

  it('should set tag filter when tag param is present', () => {
    fixture.detectChanges();
    paramsSubject.next({ tag: 'angular' });
    expect(component.listConfig()).toEqual({ type: 'all', filters: { tag: 'angular' } });
  });

  it('should set feed type when following feed is requested by authenticated user', () => {
    isAuthenticatedSubject.next(true);
    fixture.detectChanges();
    queryParamsSubject.next({ feed: 'following' });
    expect(component.listConfig()).toEqual({ type: 'feed', filters: {} });
    expect(component.isFollowingFeed()).toBe(true);
  });

  it('should redirect to login when unauthenticated user requests following feed', () => {
    isAuthenticatedSubject.next(false);
    fixture.detectChanges();
    queryParamsSubject.next({ feed: 'following' });
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should parse page from query params', () => {
    fixture.detectChanges();
    queryParamsSubject.next({ page: '3' });
    expect(component.currentPage()).toBe(3);
  });

  it('should default to page 1 when no page param', () => {
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);
  });

  it('should not be following feed by default', () => {
    fixture.detectChanges();
    expect(component.isFollowingFeed()).toBe(false);
  });

  describe('onPageChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate with page param for page > 1', () => {
      component.onPageChange(2);
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { page: 2 },
      });
    });

    it('should not include page param for page 1', () => {
      component.onPageChange(1);
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: {},
      });
    });
  });
});
