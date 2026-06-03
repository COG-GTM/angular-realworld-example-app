import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { initTestBed } from '../../../testing/setup-test-bed';
import { errorInterceptor } from './error.interceptor';
import { UserService } from '../auth/services/user.service';

describe('errorInterceptor', () => {
  let userService: { purgeAuth: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    initTestBed();
  });

  beforeEach(() => {
    userService = { purgeAuth: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: UserService, useValue: userService }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  function run(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => errorInterceptor(req, next));
  }

  it('should pass through successful responses unchanged', async () => {
    const event = {} as HttpEvent<unknown>;
    const next: HttpHandlerFn = () => of(event);
    const result = await firstValueFrom(run(new HttpRequest('GET', '/articles'), next));
    expect(result).toBe(event);
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should purge auth on 401 for non /user endpoints', async () => {
    const err = new HttpErrorResponse({ status: 401, error: { errors: { body: ['bad'] } } });
    const next: HttpHandlerFn = () => throwError(() => err);
    await expect(firstValueFrom(run(new HttpRequest('GET', '/articles'), next))).rejects.toMatchObject({
      status: 401,
      errors: { body: ['bad'] },
    });
    expect(userService.purgeAuth).toHaveBeenCalledTimes(1);
  });

  it('should NOT purge auth on 401 for the /user endpoint', async () => {
    const err = new HttpErrorResponse({ status: 401, error: { errors: {} } });
    const next: HttpHandlerFn = () => throwError(() => err);
    await expect(firstValueFrom(run(new HttpRequest('GET', '/user'), next))).rejects.toBeTruthy();
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should not purge auth on non-401 errors', async () => {
    const err = new HttpErrorResponse({ status: 500, error: { errors: { server: ['down'] } } });
    const next: HttpHandlerFn = () => throwError(() => err);
    await expect(firstValueFrom(run(new HttpRequest('GET', '/articles'), next))).rejects.toMatchObject({
      status: 500,
    });
    expect(userService.purgeAuth).not.toHaveBeenCalled();
  });

  it('should provide a fallback network error message when body is missing', async () => {
    const err = new HttpErrorResponse({ status: 0, error: null });
    const next: HttpHandlerFn = () => throwError(() => err);
    await expect(firstValueFrom(run(new HttpRequest('GET', '/articles'), next))).rejects.toMatchObject({
      status: 0,
      errors: { network: ['Unable to connect. Please check your internet connection.'] },
    });
  });
});
