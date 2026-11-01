import { z } from 'zod';

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
