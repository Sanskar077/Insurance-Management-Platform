import type { NextFunction, Response } from 'express';
import type { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import { ForbiddenError, UnauthorizedError } from '@utils/AppError.js';

/**
 * Restricts a route to one or more roles. Must run after `authenticate`.
 * Business-level permission rules (e.g. an Agent only editing their own
 * customers) are implemented in later sessions — this only checks role.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
