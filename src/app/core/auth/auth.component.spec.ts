import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed, ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { of, throwError } from 'rxjs';
import AuthComponent from './auth.component';
import { UserService } from './services/user.service';
import { User } from './user.model';

describe('AuthComponent', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;
  let userService: { login: ReturnType<typeof vi.fn>; register: ReturnType<typeof vi.fn> };
  let realRouter: Router;

  const mockUser: User = {
    email: 'test@example.com',
    token: 'test-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  function createComponent(path: string) {
    const route = {
      snapshot: {
        url: [new UrlSegment(path, {})],
      },
    };

    userService = {
      login: vi.fn().mockReturnValue(of({ user: mockUser })),
      register: vi.fn().mockReturnValue(of({ user: mockUser })),
    };

    TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: route },
        { provide: UserService, useValue: userService },
      ],
    });

    realRouter = TestBed.inject(Router);
    vi.spyOn(realRouter, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('login page', () => {
    beforeEach(() => {
      createComponent('login');
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should set title to Sign in', () => {
      expect(component.title).toBe('Sign in');
    });

    it('should set authType to login', () => {
      expect(component.authType).toBe('login');
    });

    it('should have email and password controls', () => {
      expect(component.authForm.contains('email')).toBe(true);
      expect(component.authForm.contains('password')).toBe(true);
    });

    it('should not have username control', () => {
      expect(component.authForm.contains('username')).toBe(false);
    });

    it('should call login on submit', () => {
      component.authForm.setValue({ email: 'test@example.com', password: 'password123' });
      component.submitForm();
      expect(userService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should navigate to home on successful login', () => {
      component.authForm.setValue({ email: 'test@example.com', password: 'password123' });
      component.submitForm();
      expect(realRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set isSubmitting on submit', () => {
      component.authForm.setValue({ email: 'test@example.com', password: 'password123' });
      component.submitForm();
      expect(component.isSubmitting()).toBe(true);
    });

    it('should set errors on login failure', () => {
      const errorResponse = { errors: { 'email or password': 'is invalid' } };
      userService.login.mockReturnValue(throwError(() => errorResponse));
      component.authForm.setValue({ email: 'test@example.com', password: 'wrong' });
      component.submitForm();
      expect(component.errors()).toEqual(errorResponse);
      expect(component.isSubmitting()).toBe(false);
    });

    it('should show Need an account? link', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Need an account?');
    });
  });

  describe('register page', () => {
    beforeEach(() => {
      createComponent('register');
    });

    it('should set title to Sign up', () => {
      expect(component.title).toBe('Sign up');
    });

    it('should set authType to register', () => {
      expect(component.authType).toBe('register');
    });

    it('should have username, email, and password controls', () => {
      expect(component.authForm.contains('username')).toBe(true);
      expect(component.authForm.contains('email')).toBe(true);
      expect(component.authForm.contains('password')).toBe(true);
    });

    it('should call register on submit', () => {
      component.authForm.setValue({ username: 'newuser', email: 'new@example.com', password: 'password123' });
      component.submitForm();
      expect(userService.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });

    it('should navigate to home on successful register', () => {
      component.authForm.setValue({ username: 'newuser', email: 'new@example.com', password: 'password123' });
      component.submitForm();
      expect(realRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set errors on register failure', () => {
      const errorResponse = { errors: { username: 'has already been taken' } };
      userService.register.mockReturnValue(throwError(() => errorResponse));
      component.authForm.setValue({ username: 'existing', email: 'test@example.com', password: 'pass' });
      component.submitForm();
      expect(component.errors()).toEqual(errorResponse);
    });

    it('should show Have an account? link', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Have an account?');
    });
  });
});
