import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { UpdateUserProfileSchema } from './users.schema';

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
          meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = UpdateUserProfileSchema.parse(req.body);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name ? { name: input.name } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        success: true,
        data: updated,
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
