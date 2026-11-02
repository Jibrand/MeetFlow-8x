import type { Request, Response, NextFunction } from 'express';
import {
  COOKIE_ACCESS_TOKEN,
  verifyAccessToken,
  type AccessTokenPayload,
} from '../lib/security';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  _res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.user) {
      next();
      return;
    }
    const token: unknown = req.cookies?.[COOKIE_ACCESS_TOKEN];
    const payload = typeof token === 'string' ? verifyAccessToken(token) : null;
    if (!payload?.sessionId)
      throw Object.assign(new Error('Please sign in to continue.'), {
        status: 401,
        code: 'UNAUTHORIZED',
      });
    const [session, state] = await Promise.all([
      prisma.authSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.instanceState.findUnique({ where: { id: 'primary' } }),
    ]);
    if (!session || state?.userId !== payload.userId)
      throw Object.assign(
        new Error('Your session has ended. Please sign in again.'),
        { status: 401, code: 'UNAUTHORIZED' },
      );
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}
