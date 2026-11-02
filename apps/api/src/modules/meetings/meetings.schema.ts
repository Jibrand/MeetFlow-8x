import { z } from 'zod';

export const MeetingParticipantInputSchema = z.object({
  name: z.string().min(1, 'Participant name is required'),
  email: z.string().email('Invalid participant email').optional().nullable(),
  role: z.string().optional().nullable(),
});

export const TranscriptInputSchema = z.object({
  rawText: z.string().min(1, 'Transcript text cannot be empty'),
  sourceFilename: z.string().min(1, 'Source filename is required'),
  sourceFormat: z.enum(['txt', 'srt', 'vtt']).default('txt'),
});

export const CreateMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  startAt: z.string().datetime({ message: 'startAt must be a valid ISO 8601 datetime' }),
  endAt: z.string().datetime({ message: 'endAt must be a valid ISO 8601 datetime' }).optional().nullable(),
  timezone: z.string().default('UTC'),
  meetingStatus: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  sourceType: z
    .enum(['MANUAL', 'TRANSCRIPT_UPLOAD', 'AUDIO_UPLOAD', 'VIDEO_UPLOAD', 'CALENDAR'])
    .default('MANUAL'),
  participants: z.array(MeetingParticipantInputSchema).optional().default([]),
  transcript: TranscriptInputSchema.optional().nullable(),
});
export type CreateMeetingInput = z.infer<typeof CreateMeetingSchema>;

export const UpdateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional().nullable(),
  timezone: z.string().optional(),
  meetingStatus: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
});
export type UpdateMeetingInput = z.infer<typeof UpdateMeetingSchema>;

export const UploadTranscriptSchema = TranscriptInputSchema;
export type UploadTranscriptInput = z.infer<typeof UploadTranscriptSchema>;

export const ListMeetingsQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  processingStatus: z
    .enum(['NOT_STARTED', 'QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING', 'READY', 'FAILED'])
    .optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMeetingsQuery = z.infer<typeof ListMeetingsQuerySchema>;
