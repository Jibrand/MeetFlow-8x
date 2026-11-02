import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
}

export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check your input.',
        details,
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
    return;
  }

  // 2. Prisma Unique Constraint Errors (P2002)
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A resource with this identifier already exists.',
      },
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
    });
    return;
  }

  // 3. Explicit HTTP Errors
  const status =
    err.status ||
    err.statusCode ||
    (res.statusCode >= 400 ? res.statusCode : 500);
  const code =
    err.code ||
    (status === 401
      ? 'UNAUTHORIZED'
      : status === 403
        ? 'FORBIDDEN'
        : status === 404
          ? 'NOT_FOUND'
          : 'INTERNAL_SERVER_ERROR');

  logger.error({
    message: 'Request Error',
    requestId: req.id,
    code,
    status,
    error: err.message,
    stack:
      process.env.NODE_ENV !== 'production' && status >= 500
        ? err.stack
        : undefined,
  });

  res.status(status).json({
    success: false,
    error: {
      code,
      message:
        status >= 500
          ? 'An unexpected error occurred. Please try again.'
          : err.message || 'An unexpected error occurred.',
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
}
