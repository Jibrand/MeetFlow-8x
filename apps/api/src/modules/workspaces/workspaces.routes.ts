import { Router } from 'express';
import { workspacesController } from './workspaces.controller';
import { requireAuth } from '../../middleware/auth';

export const workspacesRouter = Router();

workspacesRouter.use(requireAuth);

workspacesRouter.get('/current', (req, res, next) => workspacesController.getCurrentWorkspace(req, res, next));
workspacesRouter.patch('/current', (req, res, next) => workspacesController.updateCurrentWorkspace(req, res, next));
