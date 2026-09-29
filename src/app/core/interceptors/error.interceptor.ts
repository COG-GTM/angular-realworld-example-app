import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../auth/services/user.service';
import { ToastService } from '../notifications/toast.service';
import { ApiError } from '../models/errors.model';
import { NETWORK_ERROR_MESSAGE, toUserMessage } from '../errors/error-messages';

/**
 * Global HTTP error interceptor.
 *
 * ## 401 Handling Strategy
 *
 * There are two layers of 401 handling:
 *
 * 1. GET /user endpoint (auth initialization):
 *    - Handled by UserService.getCurrentUser() with 4XX vs 5XX logic
 *    - This interceptor SKIPS /user to avoid double-handling
 *
 * 2. All OTHER endpoints (articles, comments, profiles, etc.):
 *    - Handled HERE - any 401 means "token expired mid-session"
 *    - We call purgeAuth() to logout immediately and show a toast
 *
 * ## Toast Notifications
 *
 * Toasts are shown here for errors that have no natural inline home:
 * - 401 on any endpoint except /user (session expired)
 * - Network (status 0) and 5XX errors on GET requests (page/feed loads)
 *
 * Failed mutations (POST/PUT/DELETE) are left to the initiating component,
 * which shows them inline (forms) or via ToastService (buttons).
 * Errors that produced a toast are flagged with `notified: true` so
 * GlobalErrorHandler and components don't report them twice.
 *
 * ## Error Format
 *
 * Re-throws errors as ApiError ({ errors, status, notified }) so that:
 * - Components can access err.errors for display (e.g., validation errors)
 * - Auth logic can check err.status for error type decisions
 * - Network errors get a user-friendly fallback message
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isUserEndpoint = req.url.endsWith('/user');

      if (err.status === 401 && !isUserEndpoint) {
        userService.purgeAuth();
      }

      const body =
        err.error && typeof err.error === 'object' && 'errors' in err.error
          ? err.error
          : { errors: { network: [NETWORK_ERROR_MESSAGE] } };

      const apiError: ApiError = { ...body, status: err.status };

      const isFailedRead = req.method === 'GET' && (err.status === 0 || err.status >= 500);
      if (!isUserEndpoint && (err.status === 401 || isFailedRead)) {
        toastService.error(toUserMessage(apiError));
        apiError.notified = true;
      }

      return throwError(() => apiError);
    }),
  );
};
