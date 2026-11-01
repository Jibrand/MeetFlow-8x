import { z } from 'zod';

// ==============================================================================
// Common API & Envelope Schemas
// ==============================================================================

export const ApiResponseMetaSchema = z.object({
  requestId: z.string().optional(),
  timestamp: z.string().datetime(),
  version: z.string().default('v1'),
});
export type ApiResponseMeta = z.infer<typeof ApiResponseMetaSchema>;

export const ApiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});
export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;

export const ApiErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ApiErrorDetailSchema).optional(),
  }),
  meta: ApiResponseMetaSchema,
});
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;

export const ApiSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: ApiResponseMetaSchema,
  });

// ==============================================================================
// Health Check Schema
// ==============================================================================

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  uptime: z.number(),
  timestamp: z.string(),
  environment: z.string(),
  version: z.string(),
  services: z.object({
    api: z.literal('operational'),
    database: z.enum(['connected', 'not_configured', 'disconnected']).default('not_configured'),
  }),
});
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// ==============================================================================
// Core Domain Models (Foundational contracts for future phases)
// ==============================================================================

export const UserRoleSchema = z.enum(['admin', 'member', 'guest']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  role: UserRoleSchema.default('member'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const MeetingStatusSchema = z.enum(['scheduled', 'processing', 'ready', 'failed']);
export type MeetingStatus = z.infer<typeof MeetingStatusSchema>;

export const TranscriptSegmentSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  speakerId: z.string(),
  speakerName: z.string(),
  startTime: z.number(), // in seconds
  endTime: z.number(),
  text: z.string(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const ActionItemStatusSchema = z.enum(['open', 'in_progress', 'completed', 'dismissed']);
export type ActionItemStatus = z.infer<typeof ActionItemStatusSchema>;

export const ActionItemSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  assigneeName: z.string().nullable().optional(),
  assigneeEmail: z.string().email().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: ActionItemStatusSchema.default('open'),
  timestampSeconds: z.number().optional(),
  createdAt: z.string().datetime(),
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export const HighlightSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  startTime: z.number(),
  endTime: z.number(),
  quote: z.string(),
  note: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const MeetingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  date: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative(),
  status: MeetingStatusSchema.default('ready'),
  recordingUrl: z.string().url().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  executiveSummary: z.string().nullable().optional(),
  keyTakeaways: z.array(z.string()).default([]),
  attendeeCount: z.number().int().default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

export const ShareLinkSchema = z.object({
  id: z.string().uuid(),
  meetingId: z.string().uuid(),
  token: z.string().min(8),
  isPublic: z.boolean().default(true),
  allowClips: z.boolean().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type ShareLink = z.infer<typeof ShareLinkSchema>;
