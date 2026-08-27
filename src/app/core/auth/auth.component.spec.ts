import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import AuthComponent from './auth.component';
import { UserService } from './services/user.service';

describe('AuthComponent', () => {
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

  function setup(authType: 'login' | 'register') {
    const userService = {
      login: vi.fn(),
      register: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { url: [{ path: authType }] } },
        },
      ],
    });
    const fixture = TestBed.createComponent(AuthComponent);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, userService, router };
  }

  it('should configure as sign in for login route', () => {
    const { component } = setup('login');
    expect(component.title).toBe('Sign in');
    expect(component.authForm.contains('username')).toBe(false);
  });

  it('should configure as sign up with username field for register route', () => {
    const { component } = setup('register');
    expect(component.title).toBe('Sign up');
    expect(component.authForm.contains('username')).toBe(true);
  });

  it('should call login and navigate home on success', () => {
    const { component, userService, router } = setup('login');
    userService.login.mockReturnValue(of({ user: {} }));

    component.authForm.patchValue({ email: 'a@b.c', password: 'secret' });
    component.submitForm();

    expect(userService.login).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret' });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should call register on submit for register route', () => {
    const { component, userService } = setup('register');
    userService.register.mockReturnValue(of({ user: {} }));

    component.authForm.patchValue({ email: 'a@b.c', password: 'secret', username: 'user' });
    component.submitForm();

    expect(userService.register).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret', username: 'user' });
  });

  it('should set errors and stop submitting on failure', () => {
    const { component, userService } = setup('login');
    const errors = { errors: { 'email or password': ['is invalid'] } };
    userService.login.mockReturnValue(throwError(() => errors));

    component.submitForm();

    expect(component.errors()).toEqual(errors);
    expect(component.isSubmitting()).toBe(false);
  });
});
