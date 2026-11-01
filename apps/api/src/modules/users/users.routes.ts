import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../../middleware/auth';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', (req, res, next) => usersController.getProfile(req, res, next));
usersRouter.patch('/me', (req, res, next) => usersController.updateProfile(req, res, next));
