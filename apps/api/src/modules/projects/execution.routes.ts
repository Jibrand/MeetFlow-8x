import { persistReconciliation } from '../../services/decision-reconciliation';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireProject, projectId } from './projects.routes';
import { processingTransaction } from '../../services/processing-transaction';
import {
  scheduleLegacyReconciliation,
  refreshSuggestions,
  requestArtifact,
} from '../../services/execution-intelligence';
export const executionRouter = Router();
executionRouter.get('/projects/:id/intelligence', async (req, res, next) => {
  try {
    const project = await requireProject(req.params.id);
    const q = z
      .object({
        meetingId: z.string().uuid().optional(),
        search: z.string().max(200).optional(),
      })
      .parse(req.query);
    await prisma.aIAction.updateMany({
      where: {
        projectId: project.id,
        status: { in: ['QUEUED', 'RUNNING'] },
        updatedAt: { lt: new Date(Date.now() - 300000) },
      },
      data: {
        status: 'FAILED',
        error: 'Generation took too long. Please retry.',
      },
    });
    const [decisions, conflicts, actions] = await Promise.all([
      prisma.decision.findMany({
        where: {
          projectId: project.id,
          ...(q.search
            ? {
                OR: [
                  { title: { contains: q.search, mode: 'insensitive' } },
                  { description: { contains: q.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ meeting: { startAt: 'desc' } }, { createdAt: 'desc' }],
        take: 200,
        include: {
          meeting: { select: { id: true, title: true, startAt: true } },
          events: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.decisionConflict.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          previousDecision: {
            include: {
              meeting: { select: { id: true, title: true, startAt: true } },
            },
          },
          newDecision: {
            include: {
              meeting: { select: { id: true, title: true, startAt: true } },
            },
          },
        },
      }),
      prisma.aIAction.findMany({
        where: {
          projectId: project.id,
          ...(q.meetingId ? { meetingId: q.meetingId } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
        include: {
          meeting: { select: { id: true, title: true, startAt: true } },
          targetActionItem: {
            select: {
              id: true,
              title: true,
              status: true,
              version: true,
              dueDate: true,
            },
          },
        },
      }),
    ]);
    const legacy = decisions.some((d) => ['CONFIRMED', 'CANCELLED'].includes(d.status));
    const reconciliation = legacy ? project.needsReview ? 'unavailable' : await scheduleLegacyReconciliation(project.id, req.workspaceId!) : null;
    res.json({ success: true, data: { decisions, conflicts, actions, reconciliation } });
  } catch (e) {
    next(e);
  }
});
executionRouter.post(
  '/projects/:id/conflicts/:conflictId/review',
  async (req, res, next) => {
    try {
      const project = await requireProject(req.params.id);
      const id = projectId(req.params.conflictId);
      const { decision } = z
        .object({ decision: z.enum(['confirm', 'dismiss']) })
        .strict()
        .parse(req.body);
      const result = await processingTransaction(async (tx) => {
        await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
        const item = await tx.decisionConflict.findFirstOrThrow({
          where: { id, projectId: project.id },
        });
        if (item.status !== 'PENDING') return item;
        const changed = await tx.decisionConflict.updateMany({
          where: { id, projectId: project.id, status: 'PENDING' },
          data: {
            status: decision === 'confirm' ? 'CONFIRMED' : 'DISMISSED',
            resolvedAt: new Date(),
          },
        });
        if (!changed.count)
          throw Object.assign(
            new Error('This conflict was already reviewed.'),
            { status: 409 },
          );
        if (decision === 'confirm') {
          await tx.decision.updateMany({
            where: { id: item.previousDecisionId, projectId: project.id },
            data: { status: 'SUPERSEDED' },
          });
          await tx.decisionEvent.createMany({
            data: [
              {
                decisionId: item.previousDecisionId,
                eventType: 'SUPERSEDED',
                evidence: { conflictId: id, newDecisionId: item.newDecisionId },
              },
              {
                decisionId: item.newDecisionId,
                eventType: 'RELATION_CONFIRMED',
                evidence: {
                  conflictId: id,
                  previousDecisionId: item.previousDecisionId,
                },
              },
            ],
          });
        }
        const decisions = await tx.decision.findMany({ where: { projectId: project.id }, include: { meeting: { select: { startAt: true } } } });
        await persistReconciliation(tx, project.id, decisions, []);
        return tx.decisionConflict.findUniqueOrThrow({ where: { id } });
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
);
executionRouter.post(
  '/projects/:id/ai-actions/:actionId/review',
  async (req, res, next) => {
    try {
      const project = await requireProject(req.params.id);
      const id = projectId(req.params.actionId);
      const { decision } = z
        .object({ decision: z.enum(['confirm', 'dismiss']) })
        .strict()
        .parse(req.body);
      const result = await processingTransaction(async (tx) => {
        await tx.project.update({
          where: { id: project.id },
          data: { updatedAt: new Date() },
        });
        const action = await tx.aIAction.findFirstOrThrow({
          where: { id, projectId: project.id },
        });
        if (['APPLIED', 'DISMISSED'].includes(action.status)) return action;
        if (decision === 'confirm') {
          if (action.type !== 'COMMITMENT_UPDATE' || !action.targetActionItemId)
            throw Object.assign(
              new Error('Only supported commitment proposals can be applied.'),
              { status: 409 },
            );
          const changes = z
            .object({
              status: z.enum(['DONE', 'BLOCKED']).optional(),
              dueDate: z.string().datetime().optional(),
              note: z.string().optional(),
            })
            .strict()
            .parse(action.proposedChanges);
          const target = await tx.actionItem.findFirstOrThrow({
            where: {
              id: action.targetActionItemId,
              projectId: project.id,
              deletedAt: null,
              archivedAt: null,
            },
          });
          const changed = await tx.actionItem.updateMany({
            where: {
              id: target.id,
              projectId: project.id,
              version: action.expectedVersion ?? -1,
            },
            data: {
              ...(changes.status ? { status: changes.status } : {}),
              ...(changes.dueDate
                ? { dueDate: new Date(changes.dueDate) }
                : {}),
              version: { increment: 1 },
            },
          });
          if (!changed.count)
            throw Object.assign(
              new Error(
                'The task changed after this proposal. Review the latest task before applying it.',
              ),
              { status: 409 },
            );
          await tx.commitmentHistory.create({
            data: {
              projectId: project.id,
              actionItemId: target.id,
              meetingId: action.meetingId,
              eventType: 'CONFIRMED',
              evidence: {
                source: action.evidence,
                changes,
                previousStatus: target.status,
                previousDueDate: target.dueDate?.toISOString() ?? null,
              },
            },
          });
        } else if (action.targetActionItemId)
          await tx.commitmentHistory.create({
            data: {
              projectId: project.id,
              actionItemId: action.targetActionItemId,
              meetingId: action.meetingId,
              eventType: 'DISMISSED',
              evidence: { source: action.evidence, aiActionId: action.id },
            },
          });
        return tx.aIAction.update({
          where: { id },
          data: { status: decision === 'confirm' ? 'APPLIED' : 'DISMISSED' },
        });
      });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
);
executionRouter.post(
  '/projects/:id/ai-actions/:actionId/generate',
  async (req, res, next) => {
    try {
      const project = await requireProject(req.params.id);
      const id = projectId(req.params.actionId);
      const input = z
        .object({ retry: z.boolean().default(false) })
        .strict()
        .parse(req.body);
      res.json({
        success: true,
        data: await requestArtifact(id, project.id, input.retry),
      });
    } catch (e) {
      next(e);
    }
  },
);
executionRouter.post(
  '/meetings/:id/suggestions/refresh',
  async (req, res, next) => {
    try {
      const id = projectId(req.params.id);
      z.object({}).strict().parse(req.body);
      res.json({ success: true, data: await refreshSuggestions(id) });
    } catch (e) {
      next(e);
    }
  },
);
