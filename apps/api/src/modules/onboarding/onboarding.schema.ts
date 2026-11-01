import { z } from 'zod';

export const UpdateOnboardingSchema = z.object({
  professionalRole: z.string().min(1).max(100).optional(),
  primaryUseCases: z.array(z.string().min(1).max(100)).optional(),
  currentStep: z.number().int().min(1).max(5).optional(),
});

export type UpdateOnboardingInput = z.infer<typeof UpdateOnboardingSchema>;

export const UpdateOnboardingWorkspaceSchema = z.object({
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  orgName: z.string().max(100).optional(),
});

export type UpdateOnboardingWorkspaceInput = z.infer<typeof UpdateOnboardingWorkspaceSchema>;
