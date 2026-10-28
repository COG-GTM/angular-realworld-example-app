import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { combineLatest, filter, map, take } from 'rxjs';
import { UserService } from '../../core/auth/services/user.service';

/**
 * Reading list is private: only the signed-in owner of the profile may open it.
 * Waits for auth initialization so a persisted session isn't redirected on reload.
 */
export const readingListGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const userService = inject(UserService);
  const username = route.parent?.params['username'] ?? route.params['username'];

  return combineLatest([userService.authState, userService.currentUser]).pipe(
    filter(([state]) => state !== 'loading'),
    take(1),
    map(([state, user]) => {
      if (state === 'unauthenticated') {
        return router.createUrlTree(['/login']);
      }
      if (!user || user.username !== username) {
        return router.createUrlTree(['/profile', username]);
      }
      return true;
    }),
  );
};
