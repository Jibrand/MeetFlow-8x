import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import {
  CreateActionItemSchema,
  UpdateActionItemSchema,
  ListActionItemsQuerySchema,
} from './action-items.schema';

export class ActionItemsController {
  /**
   * GET /api/v1/action-items
   */
  async listActionItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const query = ListActionItemsQuerySchema.parse(req.query);

      const where: any = { workspaceId };
      if (query.meetingId) where.meetingId = query.meetingId;
      if (query.status) where.status = query.status;
      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { assigneeName: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const total = await prisma.actionItem.count({ where });
      const totalPages = Math.ceil(total / query.limit) || 1;
      const skip = (query.page - 1) * query.limit;

      const items = await prisma.actionItem.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              startAt: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          actionItems: items.map((item) => ({
            id: item.id,
            workspaceId: item.workspaceId,
            meetingId: item.meetingId,
            meetingTitle: item.meeting?.title || null,
            meetingStartAt: item.meeting?.startAt || null,
            title: item.title,
            description: item.description,
            assigneeName: item.assigneeName,
            assigneeUserId: item.assigneeUserId,
            dueDate: item.dueDate,
            status: item.status,
            source: item.source,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
          pagination: {
            total,
            page: query.page,
            limit: query.limit,
            totalPages,
          },
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/action-items
   */
  async createActionItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const input = CreateActionItemSchema.parse(req.body);

      // If meetingId provided, verify workspace ownership
      if (input.meetingId) {
        const meeting = await prisma.meeting.findFirst({
          where: { id: input.meetingId, workspaceId },
        });
        if (!meeting) {
          res.status(404).json({
            success: false,
            error: { code: 'MEETING_NOT_FOUND', message: 'Target meeting not found in workspace.' },
            meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
          });
          return;
        }
      }

      const item = await prisma.actionItem.create({
        data: {
          workspaceId,
          meetingId: input.meetingId || null,
          title: input.title,
          description: input.description || null,
          assigneeName: input.assigneeName || null,
          assigneeUserId: input.assigneeUserId || null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          status: input.status,
          source: 'MANUAL',
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...item,
          meetingTitle: item.meeting?.title || null,
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/action-items/:id
   */
  async updateActionItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;
      const input = UpdateActionItemSchema.parse(req.body);

      const existing = await prisma.actionItem.findFirst({
        where: { id, workspaceId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'ACTION_ITEM_NOT_FOUND', message: 'Action item not found.' },
          meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
        });
        return;
      }

      const updated = await prisma.actionItem.update({
        where: { id },
        data: {
          ...(input.title ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.assigneeName !== undefined ? { assigneeName: input.assigneeName } : {}),
          ...(input.assigneeUserId !== undefined ? { assigneeUserId: input.assigneeUserId } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          ...updated,
          meetingTitle: updated.meeting?.title || null,
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/action-items/:id
   */
  async deleteActionItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;

      const existing = await prisma.actionItem.findFirst({
        where: { id, workspaceId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'ACTION_ITEM_NOT_FOUND', message: 'Action item not found.' },
          meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
        });
        return;
      }

      await prisma.actionItem.delete({
        where: { id },
      });

      res.status(200).json({
        success: true,
        data: { id, deleted: true },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const actionItemsController = new ActionItemsController();
