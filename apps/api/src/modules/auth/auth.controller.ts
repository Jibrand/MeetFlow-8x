import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import {
  RegisterInputSchema,
  LoginInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
} from './auth.schema';
import {
  setAuthCookies,
  clearAuthCookies,
  COOKIE_REFRESH_TOKEN,
} from '../../lib/security';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = RegisterInputSchema.parse(req.body);
      const result = await authService.register(input);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          workspace: result.workspace,
          onboarding: result.onboarding,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = LoginInputSchema.parse(req.body);
      const result = await authService.login(input);

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          workspace: result.workspace,
          onboarding: result.onboarding,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.[COOKIE_REFRESH_TOKEN] || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token is required.',
          },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const tokens = await authService.refresh(refreshToken);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          message: 'Token refreshed successfully.',
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.[COOKIE_REFRESH_TOKEN] || req.body?.refreshToken;

      await authService.logout(refreshToken);
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully.',
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      clearAuthCookies(res);
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ForgotPasswordInputSchema.parse(req.body);
      await authService.forgotPassword(input.email);

      res.status(200).json({
        success: true,
        data: {
          message:
            'If an account exists with this email address, password recovery instructions have been initiated.',
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ResetPasswordInputSchema.parse(req.body);
      await authService.resetPassword(input);

      res.status(200).json({
        success: true,
        data: {
          message: 'Password has been reset successfully. Please sign in.',
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
