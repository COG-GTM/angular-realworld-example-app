import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { FavoriteButtonComponent } from './favorite-button.component';
import { ArticlesService } from '../services/articles.service';
import { UserService } from '../../../core/auth/services/user.service';
import { Article } from '../models/article.model';

describe('FavoriteButtonComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  const article: Article = {
    slug: 'test-article',
    title: 'Test',
    description: 'Desc',
    body: 'Body',
    tagList: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    favorited: false,
    favoritesCount: 3,
    author: { username: 'author', bio: null, image: '', following: false },
  };

  let favorite$: Subject<Article>;
  let unfavorite$: Subject<void>;
  let isAuthenticated: BehaviorSubject<boolean>;
  let articlesService: { favorite: ReturnType<typeof vi.fn>; unfavorite: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  function create(input: Article) {
    const fixture = TestBed.createComponent(FavoriteButtonComponent);
    fixture.componentRef.setInput('article', input);
    const emitted: boolean[] = [];
    fixture.componentInstance.toggle.subscribe(favorited => {
      emitted.push(favorited);
      fixture.componentRef.setInput('article', { ...fixture.componentInstance.article, favorited });
    });
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, emitted };
  }

  beforeEach(() => {
    favorite$ = new Subject<Article>();
    unfavorite$ = new Subject<void>();
    isAuthenticated = new BehaviorSubject(true);
    articlesService = {
      favorite: vi.fn(() => favorite$),
      unfavorite: vi.fn(() => unfavorite$),
    };
    router = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      imports: [FavoriteButtonComponent],
      providers: [
        { provide: ArticlesService, useValue: articlesService },
        { provide: UserService, useValue: { isAuthenticated } },
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('emits the favorited state immediately, before the request completes', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();

    expect(articlesService.favorite).toHaveBeenCalledWith('test-article');
    expect(emitted).toEqual([true]);
    expect(component.isSubmitting()).toBe(true);
  });

  it('does not emit again when the request succeeds', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    favorite$.next({ ...article, favorited: true, favoritesCount: 4 });
    favorite$.complete();

    expect(emitted).toEqual([true]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('rolls back to the original state when favoriting fails', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    favorite$.error({ status: 500 });

    expect(emitted).toEqual([true, false]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('emits unfavorited immediately and rolls back when unfavoriting fails', () => {
    const { component, emitted } = create({ ...article, favorited: true });

    component.toggleFavorite();
    expect(articlesService.unfavorite).toHaveBeenCalledWith('test-article');
    expect(emitted).toEqual([false]);

    unfavorite$.error({ status: 500 });
    expect(emitted).toEqual([false, true]);
  });

  it('updates immediately on rapid clicks and only syncs the latest intent', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    component.toggleFavorite();

    expect(emitted).toEqual([true, false]);
    expect(articlesService.favorite).toHaveBeenCalledTimes(1);
    expect(articlesService.unfavorite).not.toHaveBeenCalled();

    favorite$.next({ ...article, favorited: true });
    favorite$.complete();
    expect(articlesService.unfavorite).toHaveBeenCalledWith('test-article');
    expect(component.isSubmitting()).toBe(true);

    unfavorite$.next();
    unfavorite$.complete();
    expect(emitted).toEqual([true, false]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not send a follow-up request when rapid clicks end on the in-flight state', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    component.toggleFavorite();
    component.toggleFavorite();
    favorite$.next({ ...article, favorited: true });
    favorite$.complete();

    expect(emitted).toEqual([true, false, true]);
    expect(articlesService.favorite).toHaveBeenCalledTimes(1);
    expect(articlesService.unfavorite).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not emit a rollback when the UI already shows the confirmed state', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    component.toggleFavorite();
    favorite$.error({ status: 500 });

    expect(emitted).toEqual([true, false]);
    expect(articlesService.unfavorite).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('rolls back to the last confirmed state when a follow-up request fails', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    component.toggleFavorite();
    favorite$.next({ ...article, favorited: true });
    favorite$.complete();
    unfavorite$.error({ status: 500 });

    expect(emitted).toEqual([true, false, true]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('accepts a new click once the previous request has failed', () => {
    const { component, emitted } = create(article);

    component.toggleFavorite();
    favorite$.error({ status: 500 });
    favorite$ = new Subject<Article>();
    component.toggleFavorite();

    expect(articlesService.favorite).toHaveBeenCalledTimes(2);
    expect(emitted).toEqual([true, false, true]);
  });

  it('redirects unauthenticated users without emitting or calling the API', () => {
    isAuthenticated.next(false);
    const { component, emitted } = create(article);

    component.toggleFavorite();

    expect(router.navigate).toHaveBeenCalledWith(['/register']);
    expect(articlesService.favorite).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
    expect(component.isSubmitting()).toBe(false);
  });

  it('does not re-run the toggle when auth state changes later', () => {
    const { component } = create(article);

    component.toggleFavorite();
    favorite$.error({ status: 500 });
    isAuthenticated.next(false);
    isAuthenticated.next(true);

    expect(articlesService.favorite).toHaveBeenCalledTimes(1);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
