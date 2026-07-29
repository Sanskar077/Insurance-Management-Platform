import type { Role } from '@prisma/client';

/**
 * Central permission matrix — the single source of truth for which roles may
 * perform which actions. Route files reference actions by name via
 * `requirePermission`, so the whole authorization surface is auditable here.
 *
 * Route-level checks answer "may this role ever do this action"; row-level
 * ownership ("may they do it to THIS record") stays in the service layer
 * (e.g. a CUSTOMER only reads their own policies).
 */
export const PERMISSIONS = {
  // Customers
  'customer:create': ['ADMIN', 'AGENT'],
  'customer:list': ['ADMIN', 'AGENT'],
  'customer:read': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'customer:read-own': ['CUSTOMER'],
  'customer:update': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'customer:delete': ['ADMIN'],
  'customer:history': ['ADMIN', 'AGENT', 'CUSTOMER'],

  // Policies
  'policy:create': ['ADMIN', 'AGENT'],
  'policy:list': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'policy:read': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'policy:update': ['ADMIN', 'AGENT'],
  'policy:renew': ['ADMIN', 'AGENT'],
  'policy:cancel': ['ADMIN', 'AGENT'],
  'policy:delete': ['ADMIN'],

  // Premium payments
  'payment:create': ['ADMIN', 'AGENT'],
  'payment:list': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'payment:read': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'payment:update': ['ADMIN', 'AGENT'],

  // Claims
  'claim:create': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'claim:list': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'claim:read': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'claim:update': ['ADMIN', 'AGENT'],
  'claim:approve': ['ADMIN', 'AGENT'],
  'claim:reject': ['ADMIN', 'AGENT'],
  'claim:close': ['ADMIN', 'AGENT'],

  // Documents
  'document:upload': ['ADMIN', 'AGENT'],
  'document:list': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'document:read': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'document:download': ['ADMIN', 'AGENT', 'CUSTOMER'],
  'document:delete': ['ADMIN', 'AGENT'],

  // Reports (business-wide aggregates)
  'report:view': ['ADMIN', 'AGENT'],

  // Global search (results self-scoped for CUSTOMER in the service layer)
  'search:global': ['ADMIN', 'AGENT', 'CUSTOMER'],

  // User administration
  'user:list': ['ADMIN'],
  'user:read': ['ADMIN'],
  'user:create': ['ADMIN'],
  'user:update-role': ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function rolesForPermission(permission: Permission): readonly Role[] {
  return PERMISSIONS[permission];
}
