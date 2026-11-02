import { Router } from 'express';
import { workspacesController } from './workspaces.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspace';

export const workspacesRouter = Router();

workspacesRouter.use(requireAuth, requireWorkspace);

workspacesRouter.get('/current', (req, res, next) =>
  workspacesController.getCurrentWorkspace(req, res, next),
);
workspacesRouter.patch('/current', (req, res, next) =>
  workspacesController.updateCurrentWorkspace(req, res, next),
);
