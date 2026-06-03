import { initTestBed } from '../../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { ArticleListComponent } from './article-list.component';
import { ArticlesService } from '../services/articles.service';
import { LoadingState } from '../../../core/models/loading-state.model';
import { ArticleListConfig } from '../models/article-list-config.model';

const config: ArticleListConfig = { type: 'all', filters: {} };

describe('ArticleListComponent', () => {
  let articlesService: { query: ReturnType<typeof vi.fn> };
  let component: ArticleListComponent;

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    articlesService = { query: vi.fn().mockReturnValue(of({ articles: [], articlesCount: 0 })) };
    TestBed.configureTestingModule({
      providers: [ArticleListComponent, { provide: ArticlesService, useValue: articlesService }],
    });
    component = TestBed.inject(ArticleListComponent);
    component.limit = 10;
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create with default state', () => {
    expect(component).toBeTruthy();
    expect(component.loading()).toBe(LoadingState.NOT_LOADED);
    expect(component.page()).toBe(1);
  });

  it('should run the query and compute total pages when config changes', () => {
    articlesService.query.mockReturnValue(of({ articles: [{ slug: 'a' }, { slug: 'b' }], articlesCount: 25 } as any));
    component.ngOnChanges({ config: new SimpleChange(undefined, config, true) });

    expect(component.query).toBe(config);
    expect(articlesService.query).toHaveBeenCalled();
    expect(component.loading()).toBe(LoadingState.LOADED);
    expect(component.results().length).toBe(2);
    expect(component.totalPages()).toEqual([1, 2, 3]);
  });

  it('should set the page when currentPage changes', () => {
    component.ngOnChanges({
      config: new SimpleChange(undefined, config, true),
      currentPage: new SimpleChange(undefined, 3, true),
    });
    expect(component.page()).toBe(3);
  });

  it('should apply limit and offset filters in the query', () => {
    component.query = { type: 'all', filters: {} };
    component.page.set(2);
    component.runQuery();
    expect(component.query.filters.limit).toBe(10);
    expect(component.query.filters.offset).toBe(10);
  });

  it('should change page and emit on setPageTo with a new page', () => {
    component.query = config;
    const spy = vi.fn();
    component.pageChange.subscribe(spy);
    component.setPageTo(4);
    expect(component.page()).toBe(4);
    expect(spy).toHaveBeenCalledWith(4);
    expect(articlesService.query).toHaveBeenCalled();
  });

  it('should do nothing on setPageTo with the current page', () => {
    component.query = config;
    component.setPageTo(1);
    expect(articlesService.query).not.toHaveBeenCalled();
  });
});
