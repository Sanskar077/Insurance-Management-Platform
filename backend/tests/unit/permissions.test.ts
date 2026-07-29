import { describe, expect, it } from 'vitest';
import { PERMISSIONS, rolesForPermission } from '@constants/permissions.js';

describe('permission matrix', () => {
  it('every permission names at least one role', () => {
    for (const [permission, roles] of Object.entries(PERMISSIONS)) {
      expect(roles.length, `${permission} has no roles`).toBeGreaterThan(0);
    }
  });

  it('user administration is ADMIN-only', () => {
    expect(rolesForPermission('user:list')).toEqual(['ADMIN']);
    expect(rolesForPermission('user:create')).toEqual(['ADMIN']);
    expect(rolesForPermission('user:update-role')).toEqual(['ADMIN']);
  });

  it('destructive deletes exclude AGENT and CUSTOMER', () => {
    expect(rolesForPermission('customer:delete')).toEqual(['ADMIN']);
    expect(rolesForPermission('policy:delete')).toEqual(['ADMIN']);
  });

  it('claim decisions exclude CUSTOMER', () => {
    for (const action of [
      'claim:approve',
      'claim:reject',
      'claim:close',
      'claim:update',
    ] as const) {
      expect(rolesForPermission(action)).not.toContain('CUSTOMER');
    }
  });

  it('reports are staff-only', () => {
    expect(rolesForPermission('report:view')).toEqual(['ADMIN', 'AGENT']);
  });
});
