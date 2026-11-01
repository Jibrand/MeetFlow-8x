import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'] as string | undefined;
  const requestId = existingId || randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
