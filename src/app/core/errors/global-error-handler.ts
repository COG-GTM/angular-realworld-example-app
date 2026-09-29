import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorNotifier } from './error-notifier.service';

/**
 * Last line of defence for errors nobody handled (uncaught exceptions,
 * unhandled promise rejections, observables subscribed without an error callback).
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorNotifier = inject(ErrorNotifier);

  handleError(error: unknown): void {
    console.error(error);
    this.errorNotifier.notify(error);
  }
}
