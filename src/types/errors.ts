/**
 * Normalized error shape thrown by the API client.
 *
 * `errors` maps a field/key to one or more messages. Values may be a string[]
 * (the RealWorld API convention) or a plain string; `ListErrors` handles both.
 * `status` carries the HTTP status (0 for network errors) for auth decisions.
 */
export interface Errors {
  errors: Record<string, string[] | string>;
  status?: number;
}
