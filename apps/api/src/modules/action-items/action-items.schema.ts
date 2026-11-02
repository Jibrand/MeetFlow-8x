import { z } from 'zod';

export const ActionItemStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
export type ActionItemStatus = z.infer<typeof ActionItemStatusEnum>;

export const CreateActionItemSchema = z.object({
  meetingId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  assigneeName: z.string().max(100).optional().nullable(),
  assigneeUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: ActionItemStatusEnum.default('TODO'),
});
export type CreateActionItemInput = z.infer<typeof CreateActionItemSchema>;

export const UpdateActionItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  assigneeName: z.string().max(100).optional().nullable(),
  assigneeUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: ActionItemStatusEnum.optional(),
});
export type UpdateActionItemInput = z.infer<typeof UpdateActionItemSchema>;

export const ListActionItemsQuerySchema = z.object({
  meetingId: z.string().uuid().optional(),
  status: ActionItemStatusEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListActionItemsQuery = z.infer<typeof ListActionItemsQuerySchema>;
