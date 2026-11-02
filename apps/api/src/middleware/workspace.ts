import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { WorkspaceRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      workspaceRole?: WorkspaceRole;
    }
  }
}

export async function requireWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      meta: { timestamp: new Date().toISOString(), version: 'v1', requestId: req.id },
    });
    return;
  }

  const headerWorkspaceId = req.headers['x-workspace-id'] as string | undefined;

  let membership;
  if (headerWorkspaceId) {
    membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: headerWorkspaceId,
        },
      },
      include: { workspace: true },
    });
  } else {
    membership = await prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!membership) {
    res.status(403).json({
      success: false,
      error: {
        code: 'WORKSPACE_FORBIDDEN',
        message: 'You do not have access to any workspace or the specified workspace.',
      },
      meta: { timestamp: new Date().toISOString(), version: 'v1', requestId: req.id },
    });
    return;
  }

  req.workspaceId = membership.workspaceId;
  req.workspaceRole = membership.role;
  next();
}
