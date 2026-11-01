import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limiter';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, (req, res, next) => authController.register(req, res, next));
authRouter.post('/login', authRateLimiter, (req, res, next) => authController.login(req, res, next));
authRouter.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
authRouter.post('/logout', (req, res, next) => authController.logout(req, res, next));
authRouter.get('/me', requireAuth, (req, res, next) => authController.me(req, res, next));
authRouter.post('/forgot-password', authRateLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post('/reset-password', authRateLimiter, (req, res, next) => authController.resetPassword(req, res, next));
