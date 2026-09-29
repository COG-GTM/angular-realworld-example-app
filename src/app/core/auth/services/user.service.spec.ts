import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthState, UserService } from './user.service';
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

  describe('authState', () => {
    const collectStates = () => {
      const states: AuthState[] = [];
      const sub = service.authState.subscribe(state => states.push(state));
      return { states, sub };
    };

    it("should start in 'loading'", async () => {
      expect(await firstValueFrom(service.authState)).toBe('loading');
    });

    it("should move to 'authenticated' on setAuth and 'unauthenticated' on purgeAuth", () => {
      const { states, sub } = collectStates();
      service.setAuth(mockUser);
      service.purgeAuth();
      expect(states).toEqual(['loading', 'authenticated', 'unauthenticated']);
      sub.unsubscribe();
    });

    it("should stay 'loading' when login fails", async () => {
      const { states, sub } = collectStates();
      const promise = firstValueFrom(service.login({ email: 'test@example.com', password: 'wrong' }));
      httpMock
        .expectOne('/users/login')
        .flush({ errors: { 'email or password': ['is invalid'] } }, { status: 403, statusText: 'Forbidden' });
      await expect(promise).rejects.toMatchObject({ status: 403 });
      expect(states).toEqual(['loading']);
      sub.unsubscribe();
    });
  });

  describe('getCurrentUserSync', () => {
    it('should return null before authentication', () => {
      expect(service.getCurrentUserSync()).toBeNull();
    });

    it('should return the user after setAuth and null after purgeAuth', () => {
      service.setAuth(mockUser);
      expect(service.getCurrentUserSync()).toEqual(mockUser);
      service.purgeAuth();
      expect(service.getCurrentUserSync()).toBeNull();
    });
  });

  describe('login/register error side effects', () => {
    it('should not save a token or set a user when login fails', async () => {
      const promise = firstValueFrom(service.login({ email: 'test@example.com', password: 'wrong' }));
      httpMock.expectOne('/users/login').flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
      await expect(promise).rejects.toMatchObject({ status: 401 });
      expect(jwtService.saveToken).not.toHaveBeenCalled();
      expect(service.getCurrentUserSync()).toBeNull();
    });

    it('should surface validation errors body when register fails', async () => {
      const errors = { errors: { username: ['has already been taken'] } };
      const promise = firstValueFrom(
        service.register({ username: 'existing', email: 'existing@example.com', password: 'password123' }),
      );
      httpMock.expectOne('/users').flush(errors, { status: 422, statusText: 'Unprocessable Entity' });
      await expect(promise).rejects.toMatchObject({ status: 422, error: errors });
      expect(jwtService.saveToken).not.toHaveBeenCalled();
      expect(service.getCurrentUserSync()).toBeNull();
    });

    it('should propagate network errors from login', async () => {
      const promise = firstValueFrom(service.login({ email: 'test@example.com', password: 'password123' }));
      httpMock.expectOne('/users/login').error(new ProgressEvent('error'));
      await expect(promise).rejects.toMatchObject({ status: 0 });
      expect(jwtService.saveToken).not.toHaveBeenCalled();
    });
  });

  describe('update error side effects', () => {
    it('should keep the current user unchanged when update fails', async () => {
      service.setAuth(mockUser);
      const promise = firstValueFrom(service.update({ bio: 'New bio' }));
      httpMock.expectOne('/user').flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      await expect(promise).rejects.toMatchObject({ status: 500 });
      expect(service.getCurrentUserSync()).toEqual(mockUser);
    });
  });

  describe('getCurrentUser error handling', () => {
    const failCurrentUser = (status: number) => {
      const complete = vi.fn();
      const error = vi.fn();
      service.getCurrentUser().subscribe({ complete, error });
      const req = httpMock.expectOne('/user');
      if (status === 0) {
        req.error(new ProgressEvent('error'));
      } else {
        req.flush('error', { status, statusText: 'Error' });
      }
      return { complete, error };
    };

    it.each([400, 401, 403, 404])('should purge auth on %i without retrying', async status => {
      vi.useFakeTimers();
      jwtService.getToken.mockReturnValue('stored-token');
      const { complete, error } = failCurrentUser(status);

      expect(complete).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(jwtService.destroyToken).toHaveBeenCalled();
      expect(await firstValueFrom(service.authState)).toBe('unauthenticated');

      vi.advanceTimersByTime(60_000);
      httpMock.expectNone('/user');
      vi.useRealTimers();
    });

    it.each([0, 500, 503])("should keep the token and become 'unavailable' on status %i", async status => {
      jwtService.getToken.mockReturnValue(undefined);
      const { complete, error } = failCurrentUser(status);

      expect(complete).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(jwtService.destroyToken).not.toHaveBeenCalled();
      expect(service.getCurrentUserSync()).toBeNull();
      expect(await firstValueFrom(service.authState)).toBe('unavailable');
    });
  });

  describe('auto-retry while unavailable', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      jwtService.getToken.mockReturnValue('stored-token');
    });

    afterEach(() => {
      service.purgeAuth();
      vi.useRealTimers();
    });

    const failWith500 = () =>
      httpMock.expectOne('/user').flush('error', { status: 500, statusText: 'Internal Server Error' });

    it('should retry with exponential backoff capped at 16s', () => {
      service.getCurrentUser().subscribe();
      failWith500();

      for (const delayMs of [2000, 4000, 8000, 16000, 16000]) {
        vi.advanceTimersByTime(delayMs - 1);
        httpMock.expectNone('/user');
        vi.advanceTimersByTime(1);
        failWith500();
      }
    });

    it("should go through 'loading' and become 'authenticated' when a retry succeeds", () => {
      const states: AuthState[] = [];
      const sub = service.authState.subscribe(state => states.push(state));

      service.getCurrentUser().subscribe();
      failWith500();
      vi.advanceTimersByTime(2000);
      httpMock.expectOne('/user').flush({ user: mockUser });

      expect(states).toEqual(['loading', 'unavailable', 'loading', 'authenticated']);
      expect(service.getCurrentUserSync()).toEqual(mockUser);
      sub.unsubscribe();
    });

    it('should reset the backoff after a successful retry', () => {
      service.getCurrentUser().subscribe();
      failWith500();
      vi.advanceTimersByTime(2000);
      failWith500();
      vi.advanceTimersByTime(4000);
      httpMock.expectOne('/user').flush({ user: mockUser });

      service.getCurrentUser().subscribe();
      failWith500();
      vi.advanceTimersByTime(2000);
      failWith500();
    });

    it('should purge auth if a retry returns a 4XX', async () => {
      service.getCurrentUser().subscribe();
      failWith500();
      vi.advanceTimersByTime(2000);
      httpMock.expectOne('/user').flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(jwtService.destroyToken).toHaveBeenCalled();
      expect(await firstValueFrom(service.authState)).toBe('unauthenticated');
      vi.advanceTimersByTime(60_000);
      httpMock.expectNone('/user');
    });

    it('should not schedule a retry when there is no stored token', () => {
      jwtService.getToken.mockReturnValue(undefined);
      service.getCurrentUser().subscribe();
      failWith500();
      vi.advanceTimersByTime(60_000);
      httpMock.expectNone('/user');
    });

    it('should skip the retry if the token is removed before it fires', async () => {
      service.getCurrentUser().subscribe();
      failWith500();
      jwtService.getToken.mockReturnValue(undefined);
      vi.advanceTimersByTime(2000);
      httpMock.expectNone('/user');
      expect(await firstValueFrom(service.authState)).toBe('unavailable');
    });

    it('should cancel a pending retry on logout', () => {
      service.getCurrentUser().subscribe();
      failWith500();
      service.logout();
      vi.advanceTimersByTime(60_000);
      httpMock.expectNone('/user');
    });

    it('should cancel a pending retry when the user logs in', () => {
      service.getCurrentUser().subscribe();
      failWith500();
      service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
      httpMock.expectOne('/users/login').flush({ user: mockUser });
      vi.advanceTimersByTime(60_000);
      httpMock.expectNone('/user');
    });
  });
});
