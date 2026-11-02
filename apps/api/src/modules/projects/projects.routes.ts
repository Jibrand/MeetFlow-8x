import { tasksRouter } from './tasks.routes';
import { executionRouter } from './execution.routes';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspace';
import { processingTransaction } from '../../services/processing-transaction';
export const projectsRouter = Router();
projectsRouter.use(requireAuth, requireWorkspace);
projectsRouter.use(tasksRouter, executionRouter);
const Name = z.string().trim().min(1).max(200);
const Company = z
  .object({
    name: Name,
    description: z.string().max(4000).nullable().optional(),
  })
  .strict();
const Project = Company.extend({
  companyId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).default('ACTIVE'),
});
export const projectId = (value: unknown) => z.string().uuid().parse(value);
export async function requireProject(value: unknown, companyId?: string) {
  const id = projectId(value);
  const project = await prisma.project.findFirst({
    where: { id, ...(companyId ? { companyId } : {}) },
    include: { company: true },
  });
  if (!project)
    throw Object.assign(new Error('Select a valid project in this company.'), {
      status: 404,
    });
  return project;
}
projectsRouter.get('/companies', async (_req, res, next) => {
  try {
    res.json({
      success: true,
      data: await prisma.company.findMany({
        orderBy: { name: 'asc' },
        include: { projects: { orderBy: { name: 'asc' } } },
      }),
    });
  } catch (e) {
    next(e);
  }
});
projectsRouter.post('/companies', async (req, res, next) => {
  try {
    res
      .status(201)
      .json({
        success: true,
        data: await prisma.company.create({ data: Company.parse(req.body) }),
      });
  } catch (e) {
    next(e);
  }
});
projectsRouter.patch('/companies/:id', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await prisma.company.update({
        where: { id: projectId(req.params.id) },
        data: Company.partial().parse(req.body),
      }),
    });
  } catch (e) {
    next(e);
  }
});
projectsRouter.delete('/companies/:id', async (req, res, next) => {
  try {
    await prisma.company.delete({ where: { id: projectId(req.params.id) } });
    res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    next(e);
  }
});
projectsRouter.post('/projects', async (req, res, next) => {
  try {
    const input = Project.parse(req.body);
    await prisma.company.findUniqueOrThrow({ where: { id: input.companyId } });
    res
      .status(201)
      .json({
        success: true,
        data: await prisma.project.create({
          data: input,
          include: { company: true },
        }),
      });
  } catch (e) {
    next(e);
  }
});
projectsRouter.patch('/projects/:id', async (req, res, next) => {
  try {
    const input = Project.omit({ companyId: true }).partial().parse(req.body);
    res.json({
      success: true,
      data: await prisma.project.update({
        where: { id: projectId(req.params.id) },
        data: {
          ...input,
          ...(input.status === 'ACTIVE' ? { needsReview: false } : {}),
        },
      }),
    });
  } catch (e) {
    next(e);
  }
});
projectsRouter.delete('/projects/:id', async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: projectId(req.params.id) } });
    res.json({ success: true, data: { deleted: true } });
  } catch (e) {
    next(e);
  }
});
projectsRouter.post('/meetings/:id/project', async (req, res, next) => {
  try {
    const id = projectId(req.params.id);
    const input = z
      .object({ projectId: z.string().uuid(), companyId: z.string().uuid() })
      .strict()
      .parse(req.body);
    const project = await requireProject(input.projectId, input.companyId);
    const result = await processingTransaction(async (tx) => {
      const meeting = await tx.meeting.findUniqueOrThrow({ where: { id } });
      if (
        ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'].includes(
          meeting.processingStatus,
        )
      )
        throw Object.assign(
          new Error(
            'Wait for processing to finish before changing its project.',
          ),
          { status: 409 },
        );
      if (
        (await tx.commitmentHistory.count({
          where: { actionItem: { meetingId: id }, meetingId: { not: id } },
        })) ||
        (await tx.decisionConflict.count({
          where: {
            OR: [
              { previousDecision: { meetingId: id } },
              { newDecision: { meetingId: id } },
            ],
          },
        }))
      )
        throw Object.assign(
          new Error(
            'This meeting has cross-meeting history and cannot be reassigned without invalidating audit links.',
          ),
          { status: 409 },
        );
      await tx.actionItem.updateMany({
        where: { meetingId: id },
        data: { projectId: project.id, fingerprint: null },
      });
      await tx.decision.updateMany({
        where: { meetingId: id },
        data: { projectId: project.id },
      });
      await tx.aIAction.updateMany({
        where: { meetingId: id },
        data: { projectId: project.id },
      });
      await tx.commitmentHistory.updateMany({
        where: { meetingId: id },
        data: { projectId: project.id },
      });
      return tx.meeting.update({
        where: { id },
        data: { projectId: project.id },
        include: { project: { include: { company: true } } },
      });
    });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});
