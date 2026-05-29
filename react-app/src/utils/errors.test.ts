import { describe, it, expect } from 'vitest';
import { formatErrors } from './errors';

describe('formatErrors', () => {
  it('should return empty array for null', () => {
    expect(formatErrors(null)).toEqual([]);
  });

  it('should format errors object into string array', () => {
    const errors = { errors: { email: 'is invalid', password: 'is too short' } };
    const result = formatErrors(errors);
    expect(result).toContain('email is invalid');
    expect(result).toContain('password is too short');
  });

  it('should return empty array for empty errors', () => {
    expect(formatErrors({ errors: {} })).toEqual([]);
  });
});
