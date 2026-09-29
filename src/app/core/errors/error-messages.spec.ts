import { describe, it, expect } from 'vitest';
import {
  FORBIDDEN_MESSAGE,
  formatErrors,
  GENERIC_ERROR_MESSAGE,
  isApiError,
  NETWORK_ERROR_MESSAGE,
  NOT_FOUND_MESSAGE,
  SERVER_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  toUserMessage,
} from './error-messages';

describe('error-messages', () => {
  describe('isApiError', () => {
    it('accepts normalized API errors', () => {
      expect(isApiError({ errors: {}, status: 500 })).toBe(true);
    });

    it.each([null, undefined, 'boom', new Error('boom'), { status: 500 }, { errors: null, status: 500 }])(
      'rejects %s',
      value => {
        expect(isApiError(value)).toBe(false);
      },
    );
  });

  describe('formatErrors', () => {
    it('returns an empty list for null/undefined/empty', () => {
      expect(formatErrors(null)).toEqual([]);
      expect(formatErrors(undefined)).toEqual([]);
      expect(formatErrors({ errors: {} })).toEqual([]);
    });

    it('prefixes each message with its field name', () => {
      expect(formatErrors({ errors: { email: 'is taken', username: 'is too short' } })).toEqual([
        'email is taken',
        'username is too short',
      ]);
    });
  });

  describe('toUserMessage', () => {
    it.each([
      [0, NETWORK_ERROR_MESSAGE],
      [401, SESSION_EXPIRED_MESSAGE],
      [403, FORBIDDEN_MESSAGE],
      [404, NOT_FOUND_MESSAGE],
      [500, SERVER_ERROR_MESSAGE],
      [503, SERVER_ERROR_MESSAGE],
    ])('maps status %i to a friendly message', (status, expected) => {
      expect(toUserMessage({ errors: { body: 'x' }, status })).toBe(expected);
    });

    it('uses the first server validation message for other 4XX errors', () => {
      expect(toUserMessage({ errors: { title: "can't be blank" }, status: 422 })).toBe("title can't be blank");
    });

    it('falls back to a generic message when a 4XX has no details', () => {
      expect(toUserMessage({ errors: {}, status: 400 })).toBe(GENERIC_ERROR_MESSAGE);
    });

    it('uses a generic message for non-API errors', () => {
      expect(toUserMessage(new TypeError('undefined is not a function'))).toBe(GENERIC_ERROR_MESSAGE);
      expect(toUserMessage('boom')).toBe(GENERIC_ERROR_MESSAGE);
    });
  });
});
