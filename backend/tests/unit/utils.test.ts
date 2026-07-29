import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '@utils/jwt.js';
import { hashPassword, comparePassword, generateTemporaryPassword } from '@utils/password.js';
import { buildPaginationMeta } from '@app-types/pagination.types.js';

describe('jwt utils', () => {
  it('round-trips a payload', () => {
    const token = signAccessToken({ userId: 'user-1', role: 'AGENT' });
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe('user-1');
    expect(decoded.role).toBe('AGENT');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ userId: 'user-1', role: 'AGENT' });
    expect(() => verifyAccessToken(token.slice(0, -2) + 'xx')).toThrow();
  });
});

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Secret123!');
    expect(hash).not.toBe('Secret123!');
    expect(await comparePassword('Secret123!', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });

  it('generates distinct temporary passwords', () => {
    expect(generateTemporaryPassword()).not.toBe(generateTemporaryPassword());
  });
});

describe('buildPaginationMeta', () => {
  it('computes pages and flags', () => {
    const meta = buildPaginationMeta(25, 2, 10);
    expect(meta).toEqual({
      currentPage: 2,
      totalPages: 3,
      totalRecords: 25,
      hasNext: true,
      hasPrevious: true,
    });
  });

  it('handles an empty result set', () => {
    const meta = buildPaginationMeta(0, 1, 10);
    expect(meta.totalPages).toBe(1); // floor of 1 page even when empty
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(false);
  });
});
