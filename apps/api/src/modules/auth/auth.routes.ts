import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { instanceContext } from '../../services/instance';
export const authRouter = Router();
// Compatibility read for the single-admin shell. Account/session mutations are intentionally absent.
authRouter.get('/me', async (_req, res, next) => {
  try {
    const admin = await instanceContext();
    const [user, workspace] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: admin.userId },
        select: { id: true, name: true, email: true, avatarUrl: true },
      }),
      prisma.workspace.findUniqueOrThrow({
        where: { id: admin.workspaceId },
        select: { id: true, name: true, slug: true, organizationName: true },
      }),
    ]);
    res.json({
      success: true,
      data: {
        user: { ...user, role: 'ADMIN' },
        workspace: { ...workspace, role: 'OWNER' },
        onboarding: { completed: true, currentStep: 1 },
      },
    });
  } catch (e) {
    next(e);
  }
});
