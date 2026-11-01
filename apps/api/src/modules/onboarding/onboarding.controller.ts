import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import {
  UpdateOnboardingSchema,
  UpdateOnboardingWorkspaceSchema,
} from './onboarding.schema';

export class OnboardingController {
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      let onboarding = await prisma.userOnboarding.findUnique({
        where: { userId },
      });

      if (!onboarding) {
        onboarding = await prisma.userOnboarding.create({
          data: {
            userId,
            currentStep: 1,
            primaryUseCases: [],
          },
        });
      }

      // Fetch workspace
      const member = await prisma.workspaceMember.findFirst({
        where: { userId },
        include: { workspace: true },
      });

      res.status(200).json({
        success: true,
        data: {
          currentStep: onboarding.currentStep,
          professionalRole: onboarding.professionalRole || 'Engineering',
          selectedUseCases: onboarding.primaryUseCases,
          completed: !!onboarding.completedAt,
          completedAt: onboarding.completedAt,
          workspace: member
            ? {
                id: member.workspace.id,
                name: member.workspace.name,
                organizationName: member.workspace.organizationName,
              }
            : null,
          googleConnected: false, // Accurately marked disconnected
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = UpdateOnboardingSchema.parse(req.body);

      const onboarding = await prisma.userOnboarding.upsert({
        where: { userId },
        create: {
          userId,
          professionalRole: input.professionalRole,
          primaryUseCases: input.primaryUseCases || [],
          currentStep: input.currentStep || 1,
        },
        update: {
          ...(input.professionalRole !== undefined ? { professionalRole: input.professionalRole } : {}),
          ...(input.primaryUseCases !== undefined ? { primaryUseCases: input.primaryUseCases } : {}),
          ...(input.currentStep !== undefined ? { currentStep: input.currentStep } : {}),
        },
      });

      res.status(200).json({
        success: true,
        data: {
          currentStep: onboarding.currentStep,
          professionalRole: onboarding.professionalRole,
          selectedUseCases: onboarding.primaryUseCases,
          completed: !!onboarding.completedAt,
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  async saveWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input = UpdateOnboardingWorkspaceSchema.parse(req.body);

      let member = await prisma.workspaceMember.findFirst({
        where: { userId },
        include: { workspace: true },
      });

      let workspace;
      if (member) {
        workspace = await prisma.workspace.update({
          where: { id: member.workspaceId },
          data: {
            name: input.workspaceName,
            ...(input.orgName ? { organizationName: input.orgName } : {}),
          },
        });
      } else {
        const slug = `${input.workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
        workspace = await prisma.workspace.create({
          data: {
            name: input.workspaceName,
            slug,
            organizationName: input.orgName,
            members: {
              create: {
                userId,
                role: 'OWNER',
              },
            },
          },
        });
      }

      // Advance step to 4
      await prisma.userOnboarding.upsert({
        where: { userId },
        create: { userId, currentStep: 4 },
        update: { currentStep: 4 },
      });

      res.status(200).json({
        success: true,
        data: {
          workspace: {
            id: workspace.id,
            name: workspace.name,
            organizationName: workspace.organizationName,
          },
          currentStep: 4,
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      const onboarding = await prisma.userOnboarding.upsert({
        where: { userId },
        create: {
          userId,
          currentStep: 5,
          completedAt: new Date(),
        },
        update: {
          currentStep: 5,
          completedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        data: {
          completed: true,
          completedAt: onboarding.completedAt,
          currentStep: 5,
        },
        meta: { requestId: req.id, timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const onboardingController = new OnboardingController();
