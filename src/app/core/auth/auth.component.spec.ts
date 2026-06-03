import { initTestBed } from '../../../testing/setup-test-bed';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import AuthComponent from './auth.component';
import { UserService } from './services/user.service';
import { User } from './user.model';

const user: User = { email: 'jane@example.com', token: 't', username: 'jane', bio: '', image: '' };

function configure(path: 'login' | 'register') {
  const userService = { login: vi.fn(), register: vi.fn() };
  const router = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      AuthComponent,
      { provide: UserService, useValue: userService },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { snapshot: { url: [{ path }] } } },
    ],
  });
  const component = TestBed.inject(AuthComponent);
  return { component, userService, router };
}

describe('AuthComponent', () => {
  beforeAll(() => {
    initTestBed();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(configure('login').component).toBeTruthy();
  });

  it('should configure for login on init', () => {
    const { component } = configure('login');
    component.ngOnInit();
    expect(component.authType).toBe('login');
    expect(component.title).toBe('Sign in');
    expect(component.authForm.contains('username')).toBe(false);
  });

  it('should configure for register on init and add a username control', () => {
    const { component } = configure('register');
    component.ngOnInit();
    expect(component.authType).toBe('register');
    expect(component.title).toBe('Sign up');
    expect(component.authForm.contains('username')).toBe(true);
  });

  it('should login and navigate home on success', () => {
    const { component, userService, router } = configure('login');
    userService.login.mockReturnValue(of({ user }));
    component.ngOnInit();
    component.authForm.setValue({ email: 'jane@example.com', password: 'pw' });
    component.submitForm();
    expect(userService.login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'pw' });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should register and navigate home on success', () => {
    const { component, userService, router } = configure('register');
    userService.register.mockReturnValue(of({ user }));
    component.ngOnInit();
    component.authForm.setValue({ email: 'jane@example.com', password: 'pw', username: 'jane' });
    component.submitForm();
    expect(userService.register).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should surface errors and reset submitting on failure', () => {
    const { component, userService } = configure('login');
    userService.login.mockReturnValue(throwError(() => ({ errors: { 'email or password': ['is invalid'] } })));
    component.ngOnInit();
    component.authForm.setValue({ email: 'jane@example.com', password: 'bad' });
    component.submitForm();
    expect(component.errors()).toEqual({ errors: { 'email or password': ['is invalid'] } });
    expect(component.isSubmitting()).toBe(false);
  });
});
