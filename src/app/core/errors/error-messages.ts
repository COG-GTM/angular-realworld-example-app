import { ApiError, Errors } from '../models/errors.model';

export const NETWORK_ERROR_MESSAGE = 'Unable to connect. Please check your internet connection.';
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';
export const FORBIDDEN_MESSAGE = "You don't have permission to do that.";
export const NOT_FOUND_MESSAGE = 'The requested resource could not be found.';
export const SERVER_ERROR_MESSAGE = 'Something went wrong on our end. Please try again later.';
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    typeof (err as ApiError).status === 'number' &&
    typeof (err as ApiError).errors === 'object' &&
    (err as ApiError).errors !== null
  );
}

export function formatErrors(errors: Errors | null | undefined): string[] {
  const map = errors?.errors ?? {};
  return Object.keys(map).map(key => `${key} ${map[key]}`);
}

/**
 * Maps any thrown value to a single human-readable message suitable for a toast.
 */
export function toUserMessage(err: unknown): string {
  if (!isApiError(err)) {
    return GENERIC_ERROR_MESSAGE;
  }
  if (err.status === 0) return NETWORK_ERROR_MESSAGE;
  if (err.status === 401) return SESSION_EXPIRED_MESSAGE;
  if (err.status === 403) return FORBIDDEN_MESSAGE;
  if (err.status === 404) return NOT_FOUND_MESSAGE;
  if (err.status >= 500) return SERVER_ERROR_MESSAGE;
  return formatErrors(err)[0] ?? GENERIC_ERROR_MESSAGE;
}
