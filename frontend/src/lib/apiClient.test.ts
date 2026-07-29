import { describe, expect, it } from 'vitest';
import { ApiError } from './apiClient';

describe('ApiError', () => {
  it('stores status, message, and field errors', () => {
    const err = new ApiError('Bad request', 400, [{ path: 'email', message: 'Invalid email' }]);
    expect(err.status).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.fieldErrors).toHaveLength(1);
    expect(err.fieldErrors?.[0].path).toBe('email');
  });

  it('defaults fieldErrors to undefined', () => {
    const err = new ApiError('Not found', 404);
    expect(err.fieldErrors).toBeUndefined();
  });
});
