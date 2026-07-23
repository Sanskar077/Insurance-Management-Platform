import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Store parsed/coerced query on res.locals — req.query is read-only in Express 5.
    res.locals.query = result.data;
    next();
  };
}

export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(result.error);
      return;
    }
    res.locals.params = result.data;
    next();
  };
}

/**
 * Picks a validation schema based on a request property (e.g. the
 * authenticated user's role), for endpoints where different roles are
 * permitted to submit different field sets on the same route.
 */
export function validateBodyByRole(schemasByRole: Record<string, ZodType>, fallback: ZodType) {
  return (req: Request & { user?: { role: string } }, _res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    const schema = (role && schemasByRole[role]) || fallback;
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}
