import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error({
    message: 'Unhandled server error',
    requestId: req.id,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message || 'An unexpected error occurred',
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
}
