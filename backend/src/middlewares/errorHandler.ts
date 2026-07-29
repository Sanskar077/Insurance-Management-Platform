import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { AppError } from '@utils/AppError.js';
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

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
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

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unexpected error — never leak internal details to the client.

  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.nodeEnv === 'development' && err instanceof Error ? { debug: err.message } : {}),
  });
}
