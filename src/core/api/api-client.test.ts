import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { normalizeError } from './api-client';

function makeError(status: number | undefined, data: unknown): AxiosError {
  const error = new AxiosError('boom');
  if (status !== undefined) {
    error.response = {
      status,
      data,
      statusText: '',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
  }
  return error;
}

describe('normalizeError', () => {
  it('spreads the API error body together with the status', () => {
    const result = normalizeError(makeError(422, { errors: { email: ['is invalid'] } }));
    expect(result).toEqual({ errors: { email: ['is invalid'] }, status: 422 });
  });

  it('uses a network-error fallback when there is no response', () => {
    const result = normalizeError(makeError(undefined, undefined));
    expect(result.status).toBe(0);
    expect(result.errors.network).toBeDefined();
  });

  it('uses the fallback message when the body has no errors field', () => {
    const result = normalizeError(makeError(500, 'Internal Server Error'));
    expect(result.status).toBe(500);
    expect(result.errors.network).toBeDefined();
  });
});
