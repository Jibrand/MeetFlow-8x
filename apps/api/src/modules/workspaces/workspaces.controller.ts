import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { UpdateWorkspaceSchema } from './workspaces.schema';

export class WorkspacesController {
  async getCurrentWorkspace(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      // Find user's primary workspace membership
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId, workspaceId: req.workspaceId! },
        include: {
          workspace: {
            include: {
              _count: {
                select: { members: true },
              },
            },
          },
        },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORKSPACE_NOT_FOUND',
            message: 'No workspace found for this user.',
          },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: membership.workspace.id,
          name: membership.workspace.name,
          slug: membership.workspace.slug,
          organizationName: membership.workspace.organizationName,
          role: membership.role,
          memberCount: membership.workspace._count.members,
          createdAt: membership.workspace.createdAt,
          updatedAt: membership.workspace.updatedAt,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCurrentWorkspace(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = UpdateWorkspaceSchema.parse(req.body);

      // Verify user has OWNER or ADMIN role
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId, workspaceId: req.workspaceId! },
        include: { workspace: true },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORKSPACE_NOT_FOUND',
            message: 'Workspace not found.',
          },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message:
              'Only workspace owners and administrators can update settings.',
          },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const updated = await prisma.workspace.update({
        where: { id: membership.workspaceId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.organizationName !== undefined
            ? { organizationName: input.organizationName }
            : {}),
        },
      });

      res.status(200).json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          organizationName: updated.organizationName,
          role: membership.role,
          updatedAt: updated.updatedAt,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          version: 'v1',
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const workspacesController = new WorkspacesController();
