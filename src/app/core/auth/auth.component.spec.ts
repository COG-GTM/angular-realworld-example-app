import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import AuthComponent from './auth.component';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from './services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let mockUserService: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  function createComponent(urlPath: string) {
    mockUserService = {
      login: vi.fn(),
      register: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [AuthComponent, RouterTestingModule],
      providers: [
        { provide: UserService, useValue: mockUserService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              url: [{ path: urlPath }],
            },
          },
        },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  describe('login page', () => {
    beforeEach(() => {
      createComponent('login');
    });

    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should set authType to login', () => {
      expect(component.authType).toBe('login');
    });

    it('should set title to Sign in', () => {
      expect(component.title).toBe('Sign in');
    });

    it('should have email and password controls', () => {
      expect(component.authForm.get('email')).toBeTruthy();
      expect(component.authForm.get('password')).toBeTruthy();
    });

    it('should not have username control', () => {
      expect(component.authForm.get('username')).toBeFalsy();
    });

    it('should call userService.login on submit', () => {
      mockUserService.login.mockReturnValue(of({}));
      component.authForm.setValue({ email: 'test@test.com', password: 'password123' });
      component.submitForm();
      expect(mockUserService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' });
    });

    it('should navigate to home on successful login', () => {
      mockUserService.login.mockReturnValue(of({}));
      component.authForm.setValue({ email: 'test@test.com', password: 'password123' });
      component.submitForm();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set errors on login failure', () => {
      const errorResponse = { errors: { 'email or password': 'is invalid' } };
      mockUserService.login.mockReturnValue(throwError(() => errorResponse));
      component.authForm.setValue({ email: 'test@test.com', password: 'wrong' });
      component.submitForm();
      expect(component.errors()).toEqual(errorResponse);
    });

    it('should set isSubmitting to true on submit', () => {
      mockUserService.login.mockReturnValue(of({}));
      component.authForm.setValue({ email: 'test@test.com', password: 'password123' });
      component.submitForm();
      expect(component.isSubmitting()).toBe(true);
    });

    it('should reset isSubmitting on error', () => {
      mockUserService.login.mockReturnValue(throwError(() => ({ errors: {} })));
      component.authForm.setValue({ email: 'test@test.com', password: 'wrong' });
      component.submitForm();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('register page', () => {
    beforeEach(() => {
      createComponent('register');
    });

    it('should set authType to register', () => {
      expect(component.authType).toBe('register');
    });

    it('should set title to Sign up', () => {
      expect(component.title).toBe('Sign up');
    });

    it('should have username control', () => {
      expect(component.authForm.get('username')).toBeTruthy();
    });

    it('should call userService.register on submit', () => {
      mockUserService.register.mockReturnValue(of({}));
      component.authForm.setValue({ email: 'test@test.com', password: 'password123', username: 'testuser' });
      component.submitForm();
      expect(mockUserService.register).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        username: 'testuser',
      });
    });

    it('should navigate to home on successful register', () => {
      mockUserService.register.mockReturnValue(of({}));
      component.authForm.setValue({ email: 'test@test.com', password: 'password123', username: 'testuser' });
      component.submitForm();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set errors on register failure', () => {
      const errorResponse = { errors: { username: 'has already been taken' } };
      mockUserService.register.mockReturnValue(throwError(() => errorResponse));
      component.authForm.setValue({ email: 'test@test.com', password: 'password123', username: 'taken' });
      component.submitForm();
      expect(component.errors()).toEqual(errorResponse);
    });
  });
});
