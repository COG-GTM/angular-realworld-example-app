import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initTestBed } from '../../../testing/setup-test-bed';
import { IfAuthenticatedDirective } from './if-authenticated.directive';
import { UserService } from './services/user.service';

describe('IfAuthenticatedDirective', () => {
  let isAuthenticated$: BehaviorSubject<boolean>;
  let userService: { isAuthenticated: BehaviorSubject<boolean> };
  let templateRef: TemplateRef<unknown>;
  let viewContainer: { createEmbeddedView: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

  function createDirective() {
    return TestBed.runInInjectionContext(
      () => new IfAuthenticatedDirective(templateRef, userService as unknown as UserService, viewContainer as any),
    );
  }

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject<boolean>(false);
    userService = { isAuthenticated: isAuthenticated$ };
    templateRef = {} as TemplateRef<unknown>;
    viewContainer = { createEmbeddedView: vi.fn(), clear: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: UserService, useValue: userService }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(createDirective()).toBeTruthy();
  });

  it('should render the view when ifAuthenticated=true and the user is authenticated', () => {
    isAuthenticated$.next(true);
    const dir = createDirective();
    dir.ifAuthenticated = true;
    dir.ngOnInit();
    expect(viewContainer.createEmbeddedView).toHaveBeenCalledWith(templateRef);
    expect(dir.hasView()).toBe(true);
  });

  it('should render the view when ifAuthenticated=false and the user is unauthenticated', () => {
    isAuthenticated$.next(false);
    const dir = createDirective();
    dir.ifAuthenticated = false;
    dir.ngOnInit();
    expect(viewContainer.createEmbeddedView).toHaveBeenCalledWith(templateRef);
    expect(dir.hasView()).toBe(true);
  });

  it('should not render when ifAuthenticated=true but the user is unauthenticated', () => {
    isAuthenticated$.next(false);
    const dir = createDirective();
    dir.ifAuthenticated = true;
    dir.ngOnInit();
    expect(viewContainer.createEmbeddedView).not.toHaveBeenCalled();
    expect(dir.hasView()).toBe(false);
  });

  it('should clear the view when the auth state changes to no longer match', () => {
    isAuthenticated$.next(true);
    const dir = createDirective();
    dir.ifAuthenticated = true;
    dir.ngOnInit();
    expect(dir.hasView()).toBe(true);

    isAuthenticated$.next(false);
    expect(viewContainer.clear).toHaveBeenCalled();
    expect(dir.hasView()).toBe(false);
  });
});
