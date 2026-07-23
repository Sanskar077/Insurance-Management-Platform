import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '@utils/jwt.js';
import { UnauthorizedError } from '@utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
