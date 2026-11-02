import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { RegisterInputSchema, LoginInputSchema } from './auth.schema';
import {
  setAuthCookies,
  clearAuthCookies,
  COOKIE_REFRESH_TOKEN,
  COOKIE_ACCESS_TOKEN,
  verifyAccessToken,
} from '../../lib/security';
const EmptyBody = z.object({}).strict();
const CookieToken = z
  .string()
  .regex(/^[a-f0-9]{80}$/)
  .optional();
const envelope = (req: Request, data: unknown) => ({
  success: true,
  data,
  meta: {
    requestId: req.id,
    timestamp: new Date().toISOString(),
    version: 'v1',
  },
});
export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(
        RegisterInputSchema.parse(req.body),
      );
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(201).json(
        envelope(req, {
          user: result.user,
          workspace: result.workspace,
          onboarding: result.onboarding,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(LoginInputSchema.parse(req.body));
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json(
        envelope(req, {
          user: result.user,
          workspace: result.workspace,
          onboarding: result.onboarding,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      EmptyBody.parse(req.body ?? {});
      const token = CookieToken.parse(req.cookies?.[COOKIE_REFRESH_TOKEN]);
      if (!token)
        throw Object.assign(new Error('Please sign in to continue.'), {
          status: 401,
          code: 'REFRESH_TOKEN_REQUIRED',
        });
      const result = await authService.refresh(token);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json(envelope(req, { message: 'Session refreshed.' }));
    } catch (error) {
      next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      EmptyBody.parse(req.body ?? {});
      const raw: unknown = req.cookies?.[COOKIE_REFRESH_TOKEN];
      const access: unknown = req.cookies?.[COOKIE_ACCESS_TOKEN];
      const payload =
        typeof access === 'string' ? verifyAccessToken(access) : null;
      const token = CookieToken.safeParse(raw);
      await authService.logout(
        token.success ? token.data : undefined,
        payload?.sessionId,
      );
      clearAuthCookies(res);
      res.json(envelope(req, { message: 'Logged out successfully.' }));
    } catch (error) {
      // Keep cookies on transient failure so the user can retry server-side revocation.
      next(error);
    }
  }
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(
        envelope(req, await authService.getCurrentUser(req.user!.userId)),
      );
    } catch (error) {
      next(error);
    }
  }
}
export const authController = new AuthController();
