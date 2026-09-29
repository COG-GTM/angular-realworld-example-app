import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler } from '@angular/core';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { GlobalErrorHandler } from './global-error-handler';
import { ErrorNotifier } from './error-notifier.service';
import { ToastService } from '../notifications/toast.service';
import { ApiError } from '../models/errors.model';
import { FORBIDDEN_MESSAGE, GENERIC_ERROR_MESSAGE, SERVER_ERROR_MESSAGE } from './error-messages';

describe('GlobalErrorHandler / ErrorNotifier', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let handler: ErrorHandler;
  let notifier: ErrorNotifier;
  let toastService: ToastService;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }],
    });
    handler = TestBed.inject(ErrorHandler);
    notifier = TestBed.inject(ErrorNotifier);
    toastService = TestBed.inject(ToastService);
  });

  afterEach(() => {
    toastService.clear();
    consoleError.mockRestore();
    TestBed.resetTestingModule();
  });

  const messages = () => toastService.toasts().map(t => t.message);

  describe('GlobalErrorHandler', () => {
    it('logs uncaught runtime errors and shows a generic error toast', () => {
      const error = new TypeError("Cannot read properties of undefined (reading 'slug')");

      handler.handleError(error);

      expect(consoleError).toHaveBeenCalledWith(error);
      expect(toastService.toasts()).toEqual([
        expect.objectContaining({ type: 'error', message: GENERIC_ERROR_MESSAGE }),
      ]);
    });

    it('shows a status-specific toast for unhandled API errors', () => {
      handler.handleError({ errors: { message: 'nope' }, status: 403 } satisfies ApiError);
      expect(messages()).toEqual([FORBIDDEN_MESSAGE]);
    });

    it('logs but does not re-toast API errors already notified by the interceptor', () => {
      const error: ApiError = { errors: {}, status: 500, notified: true };

      handler.handleError(error);

      expect(consoleError).toHaveBeenCalledWith(error);
      expect(toastService.toasts()).toHaveLength(0);
    });

    it('handles non-Error thrown values', () => {
      handler.handleError('string rejection');
      handler.handleError(undefined);
      expect(messages()).toEqual([GENERIC_ERROR_MESSAGE]);
    });
  });

  describe('ErrorNotifier', () => {
    it('marks API errors as notified so they are reported only once', () => {
      const error: ApiError = { errors: {}, status: 502 };

      notifier.notify(error);
      expect(error.notified).toBe(true);
      expect(messages()).toEqual([SERVER_ERROR_MESSAGE]);

      toastService.clear();
      handler.handleError(error);
      expect(toastService.toasts()).toHaveLength(0);
    });
  });
});
