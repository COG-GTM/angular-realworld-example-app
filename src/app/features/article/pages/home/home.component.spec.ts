import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import HomeComponent from './home.component';
import { TagsService } from '../../services/tags.service';
import { UserService } from '../../../../core/auth/services/user.service';
import { ArticleListComponent } from '../../components/article-list.component';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ArticleListConfig } from '../../models/article-list-config.model';

@Component({
  selector: 'app-article-list',
  template: '<div class="mock-article-list"></div>',
  standalone: true,
})
class MockArticleListComponent {
  @Input() limit!: number;
  @Input() config!: ArticleListConfig;
  @Input() currentPage = 1;
  @Input() isFollowingFeed = false;
  @Output() pageChange = new EventEmitter<number>();
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let paramsSubject: BehaviorSubject<Record<string, string>>;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;
  let router: Router;
  let mockTagsService: { getAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    paramsSubject = new BehaviorSubject<Record<string, string>>({});
    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    mockTagsService = {
      getAll: vi.fn().mockReturnValue(of(['angular', 'react', 'vue'])),
    };

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
        { provide: TagsService, useValue: mockTagsService },
        {
          provide: UserService,
          useValue: { isAuthenticated: isAuthenticatedSubject.asObservable() },
        },
      ],
    }).overrideComponent(HomeComponent, {
      remove: { imports: [ArticleListComponent] },
      add: { imports: [MockArticleListComponent] },
    });

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should default to global feed config', () => {
    fixture.detectChanges();
    expect(component.listConfig().type).toBe('all');
    expect(component.listConfig().filters).toEqual({});
  });

  it('should set tag filter when route has tag param', () => {
    fixture.detectChanges();
    paramsSubject.next({ tag: 'angular' });
    expect(component.listConfig().type).toBe('all');
    expect(component.listConfig().filters.tag).toBe('angular');
  });

  it('should set feed type when authenticated and feed=following', () => {
    fixture.detectChanges();
    isAuthenticatedSubject.next(true);
    queryParamsSubject.next({ feed: 'following' });
    expect(component.listConfig().type).toBe('feed');
    expect(component.isFollowingFeed()).toBe(true);
  });

  it('should redirect to login when feed=following and not authenticated', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    isAuthenticatedSubject.next(false);
    queryParamsSubject.next({ feed: 'following' });
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should set current page from query params', () => {
    fixture.detectChanges();
    queryParamsSubject.next({ page: '3' });
    expect(component.currentPage()).toBe(3);
  });

  it('should default to page 1 when no page param', () => {
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);
  });

  it('should update isAuthenticated signal', () => {
    fixture.detectChanges();
    expect(component.isAuthenticated()).toBe(false);
    isAuthenticatedSubject.next(true);
    expect(component.isAuthenticated()).toBe(true);
  });

  it('should load tags from TagsService', () => {
    fixture.detectChanges();
    expect(mockTagsService.getAll).toHaveBeenCalled();
  });

  it('should call onPageChange to navigate with page param', () => {
    fixture.detectChanges();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.onPageChange(2);
    expect(navigateSpy).toHaveBeenCalled();
    const callArgs = navigateSpy.mock.calls[0];
    expect(callArgs[1]?.queryParams?.page).toBe(2);
  });

  it('should not include page param when page is 1', () => {
    fixture.detectChanges();
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.onPageChange(1);
    expect(navigateSpy).toHaveBeenCalled();
    const callArgs = navigateSpy.mock.calls[0];
    expect(callArgs[1]?.queryParams?.page).toBeUndefined();
  });
});
