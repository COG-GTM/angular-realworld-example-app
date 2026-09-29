export interface Errors {
  errors: { [key: string]: string };
}

/**
 * Normalized HTTP error emitted by errorInterceptor.
 * `notified` is true when a global toast was already shown for this error.
 */
export interface ApiError extends Errors {
  status: number;
  notified?: boolean;
}
