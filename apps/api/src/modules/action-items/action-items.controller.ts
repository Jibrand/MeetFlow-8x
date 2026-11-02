import type { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { TaskInput, taskProject } from '../projects/tasks.routes';
import { requireProject } from '../projects/projects.routes';
import { processingTransaction } from '../../services/processing-transaction';
const Update = TaskInput.omit({ projectId: true, meetingId: true })
  .partial()
  .extend({ version: z.number().int().min(0).optional() });
const List = z.object({
  projectId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  meetingId: z.string().uuid().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export class ActionItemsController {
  async listActionItems(req: Request, res: Response, next: NextFunction) {
    try {
      const q = List.parse(req.query);
      let scope = q.projectId;
      if (q.meetingId) {
        const meeting = await prisma.meeting.findUniqueOrThrow({
          where: { id: q.meetingId },
        });
        if (scope && scope !== meeting.projectId)
          throw Object.assign(new Error('Meeting/project mismatch.'), {
            status: 409,
          });
        scope = meeting.projectId;
      }
      if (scope) await requireProject(scope, q.companyId);
      const where: Prisma.ActionItemWhereInput = {
        workspaceId: req.workspaceId!,
        deletedAt: null,
        archivedAt: null,
        ...(scope
          ? { projectId: scope }
          : q.companyId
            ? { project: { companyId: q.companyId } }
            : {}),
        ...(q.status ? { status: q.status } : {}),
        AND: [
          ...(q.meetingId
            ? [
                {
                  OR: [
                    { meetingId: q.meetingId },
                    { history: { some: { meetingId: q.meetingId } } },
                  ],
                },
              ]
            : []),
          ...(q.search
            ? [
                {
                  OR: [
                    {
                      title: {
                        contains: q.search,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      description: {
                        contains: q.search,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      assigneeName: {
                        contains: q.search,
                        mode: 'insensitive' as const,
                      },
                    },
                  ],
                },
              ]
            : []),
        ],
      };
      const [total, items] = await Promise.all([
        prisma.actionItem.count({ where }),
        prisma.actionItem.findMany({
          where,
          skip: (q.page - 1) * q.limit,
          take: q.limit,
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
          include: {
            meeting: { select: { id: true, title: true, startAt: true } },
          },
        }),
      ]);
      res.json({
        success: true,
        data: {
          actionItems: items.map((item) => ({
            ...item,
            meetingTitle: item.meeting?.title ?? null,
          })),
          pagination: {
            total,
            page: q.page,
            limit: q.limit,
            totalPages: Math.max(1, Math.ceil(total / q.limit)),
          },
        },
      });
    } catch (e) {
      next(e);
    }
  }
  async createActionItem(req: Request, res: Response, next: NextFunction) {
    try {
      const input = TaskInput.parse(req.body);
      const projectId = await taskProject(input);
      const item = await processingTransaction(async (tx) => {
        const task = await tx.actionItem.create({
          data: {
            projectId,
            workspaceId: req.workspaceId!,
            meetingId: input.meetingId ?? null,
            title: input.title,
            description: input.description,
            assigneeName: input.assigneeName,
            priority: input.priority,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            status: input.status,
            position: Date.now(),
            source: 'MANUAL',
          },
        });
        await tx.commitmentHistory.create({
          data: {
            projectId,
            actionItemId: task.id,
            meetingId: task.meetingId,
            eventType: 'CREATED',
            evidence: { status: task.status },
          },
        });
        return task;
      });
      res.status(201).json({ success: true, data: item });
    } catch (e) {
      next(e);
    }
  }
  async updateActionItem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      const input = Update.parse(req.body);
      const item = await processingTransaction(async (tx) => {
        const old = await tx.actionItem.findFirstOrThrow({
          where: { id, workspaceId: req.workspaceId!, deletedAt: null },
        });
        const { version, ...fields } = input;
        const changed = await tx.actionItem.updateMany({
          where: {
            id,
            projectId: old.projectId,
            version: version ?? old.version,
          },
          data: {
            ...fields,
            ...(input.dueDate !== undefined
              ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
              : {}),
            version: { increment: 1 },
          },
        });
        if (!changed.count)
          throw Object.assign(
            new Error('This task changed. Reload and retry.'),
            { status: 409 },
          );
        await tx.commitmentHistory.create({
          data: {
            projectId: old.projectId,
            actionItemId: id,
            meetingId: old.meetingId,
            eventType: 'UPDATED',
            evidence: {
              before: {
                status: old.status,
                dueDate: old.dueDate?.toISOString() ?? null,
              },
              changes: input,
            },
          },
        });
        return tx.actionItem.findUniqueOrThrow({ where: { id } });
      });
      res.json({ success: true, data: item });
    } catch (e) {
      next(e);
    }
  }
  async deleteActionItem(req: Request, res: Response, next: NextFunction) {
    try {
      const id = z.string().uuid().parse(req.params.id);
      await processingTransaction(async (tx) => {
        const old = await tx.actionItem.findFirstOrThrow({
          where: { id, workspaceId: req.workspaceId! },
        });
        if (old.deletedAt) return;
        await tx.actionItem.update({
          where: { id },
          data: { deletedAt: new Date(), version: { increment: 1 } },
        });
        await tx.commitmentHistory.create({
          data: {
            projectId: old.projectId,
            actionItemId: id,
            meetingId: old.meetingId,
            eventType: 'DELETED',
            evidence: { title: old.title },
          },
        });
      });
      res.json({ success: true, data: { id, deleted: true } });
    } catch (e) {
      next(e);
    }
  }
}
export const actionItemsController = new ActionItemsController();
