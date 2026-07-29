import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { Prisma } from '@prisma/client';
import { AppError } from '@utils/AppError.js';
import { logger } from '@utils/logger.js';
import { env } from '@config/env.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

const MULTER_ERROR_MESSAGES: Partial<Record<MulterError['code'], string>> = {
  LIMIT_FILE_SIZE: 'File exceeds the 10 MB upload limit',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
};

/**
 * Known Prisma request errors that map cleanly to client-facing responses.
 * Everything else stays a generic 500 — never leak query/schema details.
 */
function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): { statusCode: number; message: string } | null {
  switch (err.code) {
    case 'P2002':
      return { statusCode: 409, message: 'A record with this value already exists' };
    case 'P2025':
      return { statusCode: 404, message: 'Record not found' };
    case 'P2003':
      return { statusCode: 409, message: 'Operation blocked by related records' };
    default:
      return null;
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({
      success: false,
      message: MULTER_ERROR_MESSAGES[err.code] ?? 'File upload failed',
    });
    return;
  }

  // Malformed JSON body — express.json() throws a SyntaxError with a body flag.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Request body is not valid JSON',
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      logger.warn(`Prisma ${err.code} on ${req.method} ${req.originalUrl}`);
      res.status(mapped.statusCode).json({
        success: false,
        message: mapped.message,
      });
      return;
    }
  }

  // Unexpected error — log with request context, never leak internals to the
  // client (debug detail is development-only).
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.nodeEnv === 'development' && err instanceof Error ? { debug: err.message } : {}),
  });
}
