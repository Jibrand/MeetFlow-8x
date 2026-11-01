import { z } from 'zod';

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100).optional(),
  organizationName: z.string().max(100).nullable().optional(),
});

export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
