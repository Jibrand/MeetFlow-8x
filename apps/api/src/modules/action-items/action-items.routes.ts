import { Router } from 'express';
import { actionItemsController } from './action-items.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspace';

export const actionItemsRouter = Router();

actionItemsRouter.use(requireAuth, requireWorkspace);

actionItemsRouter.get('/', (req, res, next) => actionItemsController.listActionItems(req, res, next));
actionItemsRouter.post('/', (req, res, next) => actionItemsController.createActionItem(req, res, next));
actionItemsRouter.patch('/:id', (req, res, next) => actionItemsController.updateActionItem(req, res, next));
actionItemsRouter.delete('/:id', (req, res, next) => actionItemsController.deleteActionItem(req, res, next));
