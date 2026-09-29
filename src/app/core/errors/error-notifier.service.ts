import { Injectable, inject } from '@angular/core';
import { ToastService } from '../notifications/toast.service';
import { isApiError, toUserMessage } from './error-messages';

/**
 * Shows an error toast for a failed operation, unless a toast was already
 * shown for the same error (e.g. by errorInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class ErrorNotifier {
  private readonly toastService = inject(ToastService);

  notify(error: unknown): void {
    if (isApiError(error)) {
      if (error.notified) return;
      error.notified = true;
    }
    this.toastService.error(toUserMessage(error));
  }
}
