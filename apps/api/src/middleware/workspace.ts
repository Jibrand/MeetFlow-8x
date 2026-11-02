import type { Request, Response, NextFunction } from 'express';
import type { WorkspaceRole } from '@prisma/client';
import { instanceContext } from '../services/instance';
declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      workspaceRole?: WorkspaceRole;
    }
  }
}
export async function requireWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = await instanceContext();
    if (!req.user || req.user.userId !== admin.userId) {
      throw Object.assign(new Error('Please sign in as the workspace admin.'), {
        status: 401,
        code: 'UNAUTHORIZED',
      });
    }
    req.workspaceId = admin.workspaceId;
    req.workspaceRole = 'OWNER';
    next();
  } catch (error) {
    next(error);
  }
}
