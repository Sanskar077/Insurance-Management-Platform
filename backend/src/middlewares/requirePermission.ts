import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import { rolesForPermission, type Permission } from '@constants/permissions.js';
import { ForbiddenError, UnauthorizedError } from '@utils/AppError.js';

/**
 * Route guard driven by the central permission matrix
 * (constants/permissions.ts). Must run after `authenticate`.
 *
 * Prefer this over listing roles inline with `authorize(...)` — naming the
 * action keeps every route tied to one auditable matrix entry.
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!rolesForPermission(permission).includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
