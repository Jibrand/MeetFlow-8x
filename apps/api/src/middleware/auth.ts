import type { Request, Response, NextFunction } from 'express';
import type { AccessTokenPayload } from '../lib/security';
import { instanceContext } from '../services/instance';
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}
// Single-admin instance context. Deployment must keep administrative routes private.
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await instanceContext();
    req.user = { userId: admin.userId, email: admin.email };
    next();
  } catch (error) {
    next(error);
  }
}
