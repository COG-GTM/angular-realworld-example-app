import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import HomeComponent from './home.component';
import { UserService } from '../../../../core/auth/services/user.service';
import { TagsService } from '../../services/tags.service';
import { ArticleListComponent } from '../../components/article-list.component';
import { Component, Input } from '@angular/core';
import { ArticleListConfig } from '../../models/article-list-config.model';

@Component({ selector: 'app-article-list', template: '', standalone: true })
class MockArticleListComponent {
  @Input() listConfig!: ArticleListConfig;
  @Input() currentPage!: number;
}

describe('HomeComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let isAuthSubject: BehaviorSubject<boolean>;
  let paramsSubject: BehaviorSubject<Record<string, string>>;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let realRouter: Router;

  beforeEach(() => {
    isAuthSubject = new BehaviorSubject<boolean>(false);
    paramsSubject = new BehaviorSubject<Record<string, string>>({});
    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: {
            isAuthenticated: isAuthSubject.asObservable(),
          },
        },
        {
          provide: TagsService,
          useValue: {
            getAll: vi.fn().mockReturnValue(of(['angular', 'testing', 'rxjs'])),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            queryParams: queryParamsSubject.asObservable(),
            snapshot: { queryParams: {} },
          },
        },
      ],
    }).overrideComponent(HomeComponent, {
      remove: { imports: [ArticleListComponent] },
      add: { imports: [MockArticleListComponent] },
    });

    realRouter = TestBed.inject(Router);
    vi.spyOn(realRouter, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to global feed', () => {
    expect(component.listConfig()).toEqual({ type: 'all', filters: {} });
  });

  it('should set isAuthenticated from UserService', () => {
    expect(component.isAuthenticated()).toBe(false);
    isAuthSubject.next(true);
    expect(component.isAuthenticated()).toBe(true);
  });

  it('should set tag filter when tag param is present', () => {
    paramsSubject.next({ tag: 'angular' });
    expect(component.listConfig()).toEqual({ type: 'all', filters: { tag: 'angular' } });
  });

  it('should set feed type when feed=following and authenticated', () => {
    isAuthSubject.next(true);
    queryParamsSubject.next({ feed: 'following' });
    expect(component.listConfig().type).toBe('feed');
    expect(component.isFollowingFeed()).toBe(true);
  });

  it('should redirect to login when feed=following and not authenticated', () => {
    isAuthSubject.next(false);
    queryParamsSubject.next({ feed: 'following' });
    expect(realRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should parse page from query params', () => {
    queryParamsSubject.next({ page: '3' });
    expect(component.currentPage()).toBe(3);
  });

  it('should default to page 1 if no page param', () => {
    queryParamsSubject.next({});
    expect(component.currentPage()).toBe(1);
  });

  it('should update isFollowingFeed to false for global feed', () => {
    isAuthSubject.next(true);
    queryParamsSubject.next({ feed: 'following' });
    expect(component.isFollowingFeed()).toBe(true);
    queryParamsSubject.next({});
    expect(component.isFollowingFeed()).toBe(false);
  });

  describe('onPageChange', () => {
    it('should navigate with page param when page > 1', () => {
      component.onPageChange(2);
      expect(realRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: { page: 2 },
      });
    });

    it('should omit page param for page 1', () => {
      component.onPageChange(1);
      expect(realRouter.navigate).toHaveBeenCalledWith([], {
        relativeTo: expect.anything(),
        queryParams: {},
      });
    });
  });
});
