import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { authService } from './auth.service';
import { requireAuth } from '../../middleware/auth';

export const authRouter = Router();
authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
});
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many session requests. Please try again shortly.',
    },
  },
});
authRouter.get('/status', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await authService.registrationStatus() });
  } catch (error) {
    next(error);
  }
});
authRouter.post(
  '/register',
  limiter,
  (req, res, next) => void authController.register(req, res, next),
);
authRouter.post(
  '/login',
  limiter,
  (req, res, next) => void authController.login(req, res, next),
);
authRouter.post(
  '/refresh',
  refreshLimiter,
  (req, res, next) => void authController.refresh(req, res, next),
);
authRouter.post(
  '/logout',
  (req, res, next) => void authController.logout(req, res, next),
);
authRouter.get(
  '/me',
  requireAuth,
  (req, res, next) => void authController.me(req, res, next),
);
