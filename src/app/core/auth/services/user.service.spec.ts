import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { JwtService } from './jwt.service';
import { User } from '../user.model';

describe('UserService', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: UserService;
  let httpMock: HttpTestingController;
  let jwtService: any;
  let router: any;

  const mockUser: User = {
    email: 'test@example.com',
    token: 'test-jwt-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jwtService = {
      saveToken: vi.fn(),
      destroyToken: vi.fn(),
      getToken: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, { provide: JwtService, useValue: jwtService }, { provide: Router, useValue: router }],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('currentUser observable', () => {
    it('should emit null initially', async () => {
      const user = await firstValueFrom(service.currentUser);
      expect(user).toBeNull();
    });

    it('should emit distinct values only', async () => {
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      service.setAuth(mockUser);
      service.setAuth(mockUser); // Should not emit again
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(emissions).toEqual([null, mockUser]);
      sub.unsubscribe();
    });
  });

  describe('isAuthenticated observable', () => {
    it('should emit false when no user is authenticated', async () => {
      const isAuth = await firstValueFrom(service.isAuthenticated);
      expect(isAuth).toBe(false);
    });

    it('should emit true when user is authenticated', async () => {
      const emissions: boolean[] = [];
      const sub = service.isAuthenticated.subscribe(isAuth => {
        emissions.push(isAuth);
      });
      service.setAuth(mockUser);
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(emissions.length).toBe(2);
      expect(emissions[0]).toBe(false);
      expect(emissions[1]).toBe(true);
      sub.unsubscribe();
    });
  });

  describe('login', () => {
    it('should send POST request to /users/login', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      service.login(credentials).subscribe();
      const req = httpMock.expectOne('/users/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user: credentials });
      req.flush({ user: mockUser });
    });

    it('should call setAuth with returned user', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const promise = firstValueFrom(service.login(credentials));
      const req = httpMock.expectOne('/users/login');
      req.flush({ user: mockUser });
      await promise;
      expect(jwtService.saveToken).toHaveBeenCalledWith(mockUser.token);
    });

    it('should update currentUser after successful login', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      const promise = firstValueFrom(service.login(credentials));
      const req = httpMock.expectOne('/users/login');
      req.flush({ user: mockUser });
      await promise;
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual(mockUser);
      sub.unsubscribe();
    });

    it('should handle login error', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.login(credentials));
      const req = httpMock.expectOne('/users/login');
      req.flush('Invalid credentials', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 401 });
    });
  });

  describe('register', () => {
    it('should send POST request to /users', () => {
      const credentials = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      service.register(credentials).subscribe();
      const req = httpMock.expectOne('/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user: credentials });
      req.flush({ user: mockUser });
    });

    it('should call setAuth with returned user', async () => {
      const credentials = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };
      const promise = firstValueFrom(service.register(credentials));
      const req = httpMock.expectOne('/users');
      req.flush({ user: mockUser });
      await promise;
      expect(jwtService.saveToken).toHaveBeenCalledWith(mockUser.token);
    });

    it('should handle registration error', async () => {
      const credentials = {
        username: 'existing',
        email: 'existing@example.com',
        password: 'password123',
      };
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };
      const promise = firstValueFrom(service.register(credentials));
      const req = httpMock.expectOne('/users');
      req.flush('User already exists', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('logout', () => {
    it('should call purgeAuth', () => {
      service.logout();
      expect(jwtService.destroyToken).toHaveBeenCalled();
    });

    it('should navigate to home page', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should clear currentUser', async () => {
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      // First set a user
      service.setAuth(mockUser);
      service.logout();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(emissions.length).toBe(3);
      expect(emissions[2]).toBeNull();
      sub.unsubscribe();
    });
  });

  describe('getCurrentUser', () => {
    it('should send GET request to /user', () => {
      service.getCurrentUser().subscribe();
      const req = httpMock.expectOne('/user');
      expect(req.request.method).toBe('GET');
      req.flush({ user: mockUser });
    });

    it('should call setAuth on success', async () => {
      const promise = firstValueFrom(service.getCurrentUser());
      const req = httpMock.expectOne('/user');
      req.flush({ user: mockUser });
      await promise;
      expect(jwtService.saveToken).toHaveBeenCalledWith(mockUser.token);
    });

    it('should call purgeAuth on error', async () => {
      const errorResponse = { status: 401, statusText: 'Unauthorized' };
      const promise = firstValueFrom(service.getCurrentUser());
      const req = httpMock.expectOne('/user');
      req.flush('Unauthorized', errorResponse);
      try {
        await promise;
        throw new Error('should have failed');
      } catch (error) {
        expect(jwtService.destroyToken).toHaveBeenCalled();
      }
    });

    it('should share replay the result', () => {
      const observable = service.getCurrentUser();
      observable.subscribe();
      observable.subscribe();
      // Should only make one HTTP request
      const requests = httpMock.match('/user');
      expect(requests.length).toBe(1);
      requests[0].flush({ user: mockUser });
    });
  });

  describe('update', () => {
    it('should send PUT request to /user', () => {
      const updates: Partial<User> = {
        bio: 'Updated bio',
        image: 'https://example.com/new-avatar.jpg',
      };
      service.update(updates).subscribe();
      const req = httpMock.expectOne('/user');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ user: updates });
      req.flush({ user: { ...mockUser, ...updates } });
    });

    it('should update currentUser with new values', async () => {
      const updates: Partial<User> = { bio: 'Updated bio' };
      const updatedUser = { ...mockUser, ...updates };
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      const promise = firstValueFrom(service.update(updates));
      const req = httpMock.expectOne('/user');
      req.flush({ user: updatedUser });
      await promise;
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual(updatedUser);
      sub.unsubscribe();
    });

    it('should handle update error', async () => {
      const updates: Partial<User> = { bio: 'Updated bio' };
      const errorResponse = { status: 422, statusText: 'Unprocessable Entity' };
      const promise = firstValueFrom(service.update(updates));
      const req = httpMock.expectOne('/user');
      req.flush('Invalid data', errorResponse);
      await expect(promise).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('setAuth', () => {
    it('should save token to JwtService', () => {
      service.setAuth(mockUser);
      expect(jwtService.saveToken).toHaveBeenCalledWith(mockUser.token);
    });

    it('should update currentUser subject', async () => {
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      service.setAuth(mockUser);
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual(mockUser);
      sub.unsubscribe();
    });
  });

  describe('purgeAuth', () => {
    it('should destroy token in JwtService', () => {
      service.purgeAuth();
      expect(jwtService.destroyToken).toHaveBeenCalled();
    });

    it('should set currentUser to null', async () => {
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      // First set a user
      service.setAuth(mockUser);
      service.purgeAuth();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(emissions.length).toBe(3);
      expect(emissions[2]).toBeNull();
      sub.unsubscribe();
    });
  });

  describe('Unavailable mode (5XX / network errors on /user)', () => {
    const flushUserError = (status: number, statusText: string) => {
      service.getCurrentUser().subscribe();
      const req = httpMock.expectOne('/user');
      req.flush('error', { status, statusText });
    };

    it('should enter unavailable state on 500 error without destroying the token', async () => {
      flushUserError(500, 'Server Error');
      const state = await firstValueFrom(service.authState);
      expect(state).toBe('unavailable');
      expect(jwtService.destroyToken).not.toHaveBeenCalled();
    });

    it('should enter unavailable state on network error (status 0)', async () => {
      service.getCurrentUser().subscribe();
      const req = httpMock.expectOne('/user');
      req.error(new ProgressEvent('error'));
      const state = await firstValueFrom(service.authState);
      expect(state).toBe('unavailable');
      expect(jwtService.destroyToken).not.toHaveBeenCalled();
    });

    it('should set currentUser to null when unavailable', async () => {
      flushUserError(503, 'Service Unavailable');
      const user = await firstValueFrom(service.currentUser);
      expect(user).toBeNull();
    });

    it('should become unauthenticated (purge) on 4XX error', async () => {
      flushUserError(403, 'Forbidden');
      const state = await firstValueFrom(service.authState);
      expect(state).toBe('unauthenticated');
      expect(jwtService.destroyToken).toHaveBeenCalled();
    });

    it('should schedule a retry after 2s when a token exists', async () => {
      vi.useFakeTimers();
      try {
        jwtService.getToken.mockReturnValue('stored-token');
        flushUserError(500, 'Server Error');
        expect(httpMock.match('/user').length).toBe(0);
        vi.advanceTimersByTime(2000);
        const retryRequests = httpMock.match('/user');
        expect(retryRequests.length).toBe(1);
        retryRequests[0].flush({ user: mockUser });
      } finally {
        vi.useRealTimers();
      }
    });

    it('should use exponential backoff for subsequent retries (2s then 4s)', () => {
      vi.useFakeTimers();
      try {
        jwtService.getToken.mockReturnValue('stored-token');
        flushUserError(500, 'Server Error');
        vi.advanceTimersByTime(2000);
        const firstRetry = httpMock.match('/user');
        expect(firstRetry.length).toBe(1);
        firstRetry[0].flush('error', { status: 500, statusText: 'Server Error' });
        // Second retry should not fire before 4s
        vi.advanceTimersByTime(2000);
        expect(httpMock.match('/user').length).toBe(0);
        vi.advanceTimersByTime(2000);
        const secondRetry = httpMock.match('/user');
        expect(secondRetry.length).toBe(1);
        secondRetry[0].flush({ user: mockUser });
      } finally {
        vi.useRealTimers();
      }
    });

    it('should not schedule a retry when no token exists', () => {
      vi.useFakeTimers();
      try {
        jwtService.getToken.mockReturnValue(null);
        flushUserError(500, 'Server Error');
        vi.advanceTimersByTime(60000);
        expect(httpMock.match('/user').length).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should cancel pending retry when setAuth is called', () => {
      vi.useFakeTimers();
      try {
        jwtService.getToken.mockReturnValue('stored-token');
        flushUserError(500, 'Server Error');
        service.setAuth(mockUser);
        vi.advanceTimersByTime(60000);
        expect(httpMock.match('/user').length).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should cancel pending retry when purgeAuth is called', () => {
      vi.useFakeTimers();
      try {
        jwtService.getToken.mockReturnValue('stored-token');
        flushUserError(500, 'Server Error');
        service.purgeAuth();
        vi.advanceTimersByTime(60000);
        expect(httpMock.match('/user').length).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should recover to authenticated state when a retry succeeds', async () => {
      vi.useFakeTimers();
      try {
        jwtService.getToken.mockReturnValue('stored-token');
        flushUserError(500, 'Server Error');
        vi.advanceTimersByTime(2000);
        const retryRequests = httpMock.match('/user');
        expect(retryRequests.length).toBe(1);
        retryRequests[0].flush({ user: mockUser });
      } finally {
        vi.useRealTimers();
      }
      const state = await firstValueFrom(service.authState);
      expect(state).toBe('authenticated');
      expect(jwtService.saveToken).toHaveBeenCalledWith(mockUser.token);
    });
  });

  describe('getCurrentUserSync', () => {
    it('should return null when no user is set', () => {
      expect(service.getCurrentUserSync()).toBeNull();
    });

    it('should return the current user after setAuth', () => {
      service.setAuth(mockUser);
      expect(service.getCurrentUserSync()).toEqual(mockUser);
    });

    it('should return null after purgeAuth', () => {
      service.setAuth(mockUser);
      service.purgeAuth();
      expect(service.getCurrentUserSync()).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const emissions: (User | null)[] = [];
      const sub = service.currentUser.subscribe(user => {
        emissions.push(user);
      });
      // Login
      const promise = firstValueFrom(service.login(credentials));
      const req = httpMock.expectOne('/users/login');
      req.flush({ user: mockUser });
      await promise;
      expect(emissions[1]).toEqual(mockUser);
      // Logout
      service.logout();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(emissions[2]).toBeNull();
      sub.unsubscribe();
    });

    it('should maintain authentication state across multiple operations', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const loginPromise = firstValueFrom(service.login(credentials));
      const loginReq = httpMock.expectOne('/users/login');
      loginReq.flush({ user: mockUser });
      await loginPromise;
      const isAuth = await firstValueFrom(service.isAuthenticated);
      expect(isAuth).toBe(true);
      const updates = { bio: 'New bio' };
      const updatePromise = firstValueFrom(service.update(updates));
      const updateReq = httpMock.expectOne('/user');
      updateReq.flush({ user: { ...mockUser, ...updates } });
      await updatePromise;
      const stillAuth = await firstValueFrom(service.isAuthenticated);
      expect(stillAuth).toBe(true);
    });
  });
});
