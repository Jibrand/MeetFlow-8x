import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { processingTransaction } from '../../services/processing-transaction';
import { requireProject, projectId } from './projects.routes';
export const tasksRouter = Router();
export const TaskInput = z
  .object({
    projectId: z.string().uuid().optional(),
    meetingId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1).max(255),
    description: z.string().max(10000).nullable().optional(),
    assigneeName: z.string().trim().max(100).nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    dueDate: z.string().datetime().nullable().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).default('TODO'),
  })
  .strict();
export async function taskProject(input: {
  meetingId?: string | null;
  projectId?: string;
}) {
  const meeting = input.meetingId
    ? await prisma.meeting.findUniqueOrThrow({ where: { id: input.meetingId } })
    : null;
  const id = input.projectId ?? meeting?.projectId;
  const project=await requireProject(id);if(project.status==='ARCHIVED')throw Object.assign(new Error('Choose an active project.'),{status:409});
  if (meeting && meeting.projectId !== id)
    throw Object.assign(
      new Error('The task and meeting must belong to the same project.'),
      { status: 409 },
    );
  return id!;
}
tasksRouter.get('/projects/:id/board', async (req, res, next) => {
  try {
    const project = await requireProject(req.params.id);
    const q = z
      .object({
        search: z.string().max(200).optional(),
        owner: z.string().max(100).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        archived: z.enum(['true', 'false']).optional(),
      })
      .parse(req.query);
    const where: Prisma.ActionItemWhereInput = {
      projectId: project.id,
      deletedAt: null,
      archivedAt: q.archived === 'true' ? { not: null } : null,
      ...(q.owner ? { assigneeName: q.owner } : {}),
      ...(q.priority ? { priority: q.priority } : {}),
      ...(q.search
        ? {
            OR: [
              { title: { contains: q.search, mode: 'insensitive' } },
              { description: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, counts, owners] = await Promise.all([
      prisma.actionItem.findMany({
        where,
        orderBy: [{ status: 'asc' }, { position: 'asc' }, { id: 'asc' }],
        take: 1001,
        include: { meeting: { select: { id: true, title: true } } },
      }),
      prisma.actionItem.groupBy({ by: ['status'], where, _count: true }),
      prisma.actionItem.findMany({
        where: { projectId: project.id, deletedAt: null },
        distinct: ['assigneeName'],
        select: { assigneeName: true },
      }),
    ]);
    res.json({
      success: true,
      data: {
        tasks: items.slice(0, 1000),
        truncated: items.length > 1000,
        counts,
        owners: owners.map((o) => o.assigneeName).filter(Boolean),
      },
    });
  } catch (e) {
    next(e);
  }
});
tasksRouter.get('/projects/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const project = await requireProject(req.params.id);
    const task = await prisma.actionItem.findFirst({
      where: {
        id: projectId(req.params.taskId),
        projectId: project.id,
        deletedAt: null,
      },
      include: {
        meeting: { select: { id: true, title: true } },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: { meeting: { select: { id: true, title: true } } },
        },
      },
    });
    if (!task)
      throw Object.assign(new Error('Task not found in this project.'), {
        status: 404,
      });
    res.json({ success: true, data: task });
  } catch (e) {
    next(e);
  }
});
tasksRouter.post(
  '/projects/:id/tasks/:taskId/:operation',
  async (req, res, next) => {
    try {
      const project = await requireProject(req.params.id);
      const id = projectId(req.params.taskId);
      const operation = z
        .enum(['move', 'duplicate', 'archive', 'restore'])
        .parse(req.params.operation);
      const input = z
        .object({
          status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']).optional(),
          beforeId: z.string().uuid().nullable().optional(),
          afterId: z.string().uuid().nullable().optional(),
          version: z.number().int().min(0).optional(),
        })
        .strict()
        .parse(req.body);
      const result = await processingTransaction(async (tx) => {
        await tx.project.update({
          where: { id: project.id },
          data: { updatedAt: new Date() },
        });
        const task = await tx.actionItem.findFirstOrThrow({
          where: { id, projectId: project.id, deletedAt: null },
        });
        if (operation === 'duplicate') {
          const copy = await tx.actionItem.create({
            data: {
              workspaceId: req.workspaceId!,
              projectId: project.id,
              meetingId: task.meetingId,
              title: `${task.title.slice(0, 248)} (copy)`,
              description: task.description,
              assigneeName: task.assigneeName,
              priority: task.priority,
              dueDate: task.dueDate,
              status: 'TODO',
              source: 'MANUAL',
              evidence: task.evidence as Prisma.InputJsonValue,
              position: Date.now(),
            },
          });
          await tx.commitmentHistory.create({
            data: {
              projectId: project.id,
              actionItemId: copy.id,
              eventType: 'DUPLICATED',
              evidence: { sourceTaskId: task.id },
            },
          });
          return copy;
        }
        let position = task.position;
        const status = input.status ?? task.status;
        if (operation === 'move') {
          if (input.version === undefined)
            throw Object.assign(new Error('Task version is required.'), {
              status: 400,
            });
          const neighbors = await tx.actionItem.findMany({
            where: {
              id: {
                in: [input.beforeId, input.afterId].filter((v): v is string =>
                  Boolean(v),
                ),
              },
              projectId: project.id,
              status,
              deletedAt: null,
              archivedAt: null,
            },
          });
          if (
            neighbors.length !==
              new Set([input.beforeId, input.afterId].filter(Boolean)).size ||
            neighbors.some((n) => n.id === id)
          )
            throw Object.assign(
              new Error('Invalid project ordering anchors.'),
              { status: 409 },
            );
          const before = neighbors.find(
            (n) => n.id === input.beforeId,
          )?.position;
          const after = neighbors.find((n) => n.id === input.afterId)?.position;
          position =
            before !== undefined && after !== undefined
              ? (before + after) / 2
              : before !== undefined
                ? before - 1024
                : after !== undefined
                  ? after + 1024
                  : 0;
          if (
            before !== undefined &&
            after !== undefined &&
            (before <= after || before - after < 0.0001)
          ) {
            const column = await tx.actionItem.findMany({
              where: {
                projectId: project.id,
                status,
                deletedAt: null,
                archivedAt: null,
                id: { not: id },
              },
              orderBy: [{ position: 'asc' }, { id: 'asc' }],
              select: { id: true },
            });
            const at = input.beforeId
              ? column.findIndex((t) => t.id === input.beforeId)
              : column.length;
            column.splice(at, 0, { id });
            await tx.$executeRaw(
              Prisma.sql`UPDATE action_items a SET position=v.position FROM (VALUES ${Prisma.join(column.map((t, i) => Prisma.sql`(${t.id},${i * 1024}::double precision)`))}) AS v(id,position) WHERE a.id=v.id AND a."projectId"=${project.id}`,
            );
            position = at * 1024;
          }
        }
        const changed = await tx.actionItem.updateMany({
          where: {
            id,
            projectId: project.id,
            ...(input.version !== undefined ? { version: input.version } : {}),
          },
          data: {
            ...(operation === 'move'
              ? { status, position }
              : { archivedAt: operation === 'archive' ? new Date() : null }),
            version: { increment: 1 },
          },
        });
        if (!changed.count)
          throw Object.assign(
            new Error('This task changed. Reload and try again.'),
            { status: 409 },
          );
        await tx.commitmentHistory.create({
          data: {
            projectId: project.id,
            actionItemId: id,
            eventType: operation.toUpperCase(),
            evidence: { fromStatus: task.status, toStatus: status, position },
          },
        });
        return tx.actionItem.findUniqueOrThrow({ where: { id } });
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
);
