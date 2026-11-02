import { requireProject } from '../projects/projects.routes';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import {
  CreateMeetingSchema,
  UpdateMeetingSchema,
  UploadTranscriptSchema,
  ListMeetingsQuerySchema,
} from './meetings.schema';
import { enqueueMeetingProcessing } from '../../queues/meeting-processing.queue';
import { transcriptParserService } from '../../services/transcript-parser.service';
import { removeMedia } from '../../services/media.service';

export class MeetingsController {
  /**
   * POST /api/v1/meetings
   * Create meeting, optionally attach transcript and enqueue background processing.
   */
  async createMeeting(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const userId = req.user!.userId;
      const input = CreateMeetingSchema.parse(req.body);

      const project=await requireProject(input.projectId, input.companyId);
      if(project.status==='ARCHIVED')throw Object.assign(new Error('Choose an active project before creating a meeting.'),{status:409});
      const hasTranscript = Boolean(
        input.transcript && input.transcript.rawText.trim(),
      );

      const meeting = await prisma.$transaction(async (tx) => {
        const created = await tx.meeting.create({
          data: {
            workspaceId,
            projectId: input.projectId,
            createdById: userId,
            title: input.title,
            description: input.description,
            startAt: new Date(input.startAt),
            endAt: input.endAt ? new Date(input.endAt) : null,
            timezone: input.timezone,
            meetingStatus: input.meetingStatus,
            processingStatus: hasTranscript ? 'QUEUED' : 'NOT_STARTED',
            sourceType: hasTranscript ? 'TRANSCRIPT_UPLOAD' : input.sourceType,
            participants: {
              create: (input.participants || []).map((p) => ({
                name: p.name,
                email: p.email || null,
                role: p.role || null,
              })),
            },
          },
          include: {
            project: { include: { company: true } },
            participants: true,
          },
        });

        if (hasTranscript && input.transcript) {
          await tx.meetingTranscript.create({
            data: {
              meetingId: created.id,
              rawText: input.transcript.rawText,
              sourceFilename: input.transcript.sourceFilename,
              sourceFormat: input.transcript.sourceFormat,
              parserVersion: transcriptParserService.constructor.name
                ? '1.0.0'
                : '1.0.0',
            },
          });
        }

        return created;
      });

      // Enqueue background processing if transcript provided
      let queueStatus = 'NOT_QUEUED';
      if (hasTranscript) {
        const queueResult = await enqueueMeetingProcessing({
          meetingId: meeting.id,
          workspaceId,
        });
        queueStatus = queueResult.status;
      }

      res.status(201).json({
        success: true,
        data: {
          ...meeting,
          ...(queueStatus === 'REDIS_UNAVAILABLE'
            ? { processingStatus: 'FAILED' }
            : {}),
          queueStatus,
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

  /**
   * GET /api/v1/meetings/overview
   * Consolidated statistics for the Overview dashboard
   */
  async getOverviewStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const now = new Date();
      const scope = z
        .object({
          projectId: z.string().uuid().optional(),
          companyId: z.string().uuid().optional(),
        })
        .parse(req.query);
      if (scope.projectId)
        await requireProject(scope.projectId, scope.companyId);
      const scopeWhere = scope.projectId
        ? { projectId: scope.projectId }
        : scope.companyId
          ? { project: { companyId: scope.companyId } }
          : {};

      const [
        totalMeetings,
        recordedMeetings,
        openItems,
        doneItems,
        overdueItems,
        recentMeetings,
        attentionItems,
        durationTotals,
      ] = await Promise.all([
        prisma.meeting.count({ where: { workspaceId, ...scopeWhere } }),
        prisma.meeting.count({
          where: {
            workspaceId,
            ...scopeWhere,
            processingStatus: {
              in: ['READY', 'QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'],
            },
          },
        }),
        prisma.actionItem.count({
          where: {
            workspaceId,
            ...scopeWhere,
            deletedAt: null,
            archivedAt: null,
            status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
          },
        }),
        prisma.actionItem.count({
          where: {
            workspaceId,
            ...scopeWhere,
            deletedAt: null,
            archivedAt: null,
            status: 'DONE',
          },
        }),
        prisma.actionItem.count({
          where: {
            workspaceId,
            ...scopeWhere,
            deletedAt: null,
            archivedAt: null,
            status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
            dueDate: { lt: now },
          },
        }),
        prisma.meeting.findMany({
          where: { workspaceId, ...scopeWhere },
          orderBy: { startAt: 'desc' },
          take: 5,
          include: {
            project: { include: { company: true } },
            participants: true,
            summary: {
              select: { overview: true },
            },
            _count: {
              select: { actionItems: true },
            },
          },
        }),
        prisma.actionItem.findMany({
          where: {
            workspaceId,
            ...scopeWhere,
            deletedAt: null,
            archivedAt: null,
            status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
          include: {
            meeting: {
              select: { id: true, title: true },
            },
          },
        }),
        prisma.meeting.aggregate({
          where: { workspaceId, ...scopeWhere },
          _sum: { durationSeconds: true },
        }),
      ]);

      const totalSeconds = durationTotals._sum.durationSeconds ?? 0;
      const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

      res.status(200).json({
        success: true,
        data: {
          totalMeetings,
          recordedMeetings,
          totalHours,
          openActionItems: openItems,
          completedActionItems: doneItems,
          overdueActionItems: overdueItems,
          recentMeetings: recentMeetings.map(
            ({ mediaStorageKey: _key, ...meeting }) => ({
              ...meeting,
              actionItemCount: meeting._count.actionItems,
            }),
          ),
          attentionItems,
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

  /**
   * GET /api/v1/meetings
   * List meetings for the active workspace with pagination, filters, and counts.
   */
  async listMeetings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const query = ListMeetingsQuerySchema.parse(req.query);

      const where: Prisma.MeetingWhereInput = {
        workspaceId,
        ...(query.projectId
          ? { projectId: query.projectId }
          : query.companyId
            ? { project: { companyId: query.companyId } }
            : {}),
      };
      if (query.projectId)
        await requireProject(query.projectId, query.companyId);

      if (query.status) {
        where.meetingStatus = query.status;
      }
      if (query.processingStatus) {
        where.processingStatus = query.processingStatus;
      }
      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          {
            participants: {
              some: { name: { contains: query.search, mode: 'insensitive' } },
            },
          },
          { summary: { topics: { array_contains: [query.search] } } },
        ];
      }
      if (query.startDate || query.endDate) {
        where.startAt = {
          ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
          ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
        };
      }

      if (query.viewStatus === 'cancelled') where.meetingStatus = 'CANCELLED';
      else if (query.viewStatus) {
        where.meetingStatus = { not: 'CANCELLED' };
        where.processingStatus =
          query.viewStatus === 'processing'
            ? { in: ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'] }
            : query.viewStatus === 'ready'
              ? 'READY'
              : query.viewStatus === 'failed'
                ? 'FAILED'
                : 'NOT_STARTED';
      }
      if (query.platform)
        where.sourceType =
          query.platform === 'upload'
            ? { in: ['TRANSCRIPT_UPLOAD', 'AUDIO_UPLOAD', 'VIDEO_UPLOAD'] }
            : query.platform === 'meet'
              ? { in: ['MANUAL', 'CALENDAR'] }
              : { in: [] };
      const totalPromise = prisma.meeting.count({ where });
      const skip = (query.page - 1) * query.limit;

      const meetingsPromise = prisma.meeting.findMany({
        where,
        skip,
        take: query.limit,
        orderBy:
          query.sort === 'created' || query.sort === 'newest'
            ? [{ createdAt: 'desc' }, { id: 'desc' }]
            : query.sort === 'longest'
              ? [{ durationSeconds: 'desc' }, { id: 'desc' }]
              : [
                  { startAt: query.sort === 'oldest' ? 'asc' : 'desc' },
                  { id: 'desc' },
                ],
        include: {
          project: { include: { company: true } },
          participants: true,
          summary: {
            select: {
              overview: true,
              keyPoints: true,
              decisions: true,
              topics: true,
            },
          },
          _count: {
            select: {
              actionItems: true,
              segments: true,
              transcripts: true,
            },
          },
        },
      });

      const [total, meetings] = await Promise.all([
        totalPromise,
        meetingsPromise,
      ]);
      const totalPages = Math.ceil(total / query.limit) || 1;
      res.status(200).json({
        success: true,
        data: {
          meetings: meetings.map((m) => ({
            id: m.id,
            workspaceId: m.workspaceId,
            title: m.title,
            description: m.description,
            startAt: m.startAt,
            endAt: m.endAt,
            timezone: m.timezone,
            meetingStatus: m.meetingStatus,
            processingStatus: m.processingStatus,
            sourceType: m.sourceType,
            durationSeconds: m.durationSeconds,
            recordingUrl: m.recordingUrl,
            projectId: m.projectId,
            project: m.project,
            participants: m.participants,
            summary: m.summary,
            actionItemCount: m._count.actionItems,
            segmentCount: m._count.segments,
            hasTranscript: m._count.transcripts > 0,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
          })),
          pagination: {
            total,
            page: query.page,
            limit: query.limit,
            totalPages,
          },
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

  /**
   * GET /api/v1/meetings/:id
   * Get complete meeting details.
   */
  async getMeeting(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;

      const meeting = await prisma.meeting.findFirst({
        where: { id, workspaceId },
        include: {
          project: { include: { company: true } },
          participants: true,
          transcripts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              sourceFilename: true,
              sourceFormat: true,
              parserVersion: true,
              createdAt: true,
            },
          },
          commitments: { include: { actionItem: true } },
          summary: true,
          actionItems: {
            where: { deletedAt: null, archivedAt: null },
            orderBy: { createdAt: 'asc' },
          },
          segments: {
            orderBy: { sequence: 'asc' },
          },
          processingJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: {
            code: 'MEETING_NOT_FOUND',
            message: 'Meeting not found in this workspace.',
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
          ...meeting,
          actionItems: [
            ...new Map(
              [
                ...meeting.actionItems,
                ...meeting.commitments.map((h) => h.actionItem),
              ]
                .filter((t) => !t.deletedAt && !t.archivedAt)
                .map((t) => [t.id, t]),
            ).values(),
          ],
          mediaStorageKey: undefined,
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

  /**
   * PATCH /api/v1/meetings/:id
   * Update meeting metadata.
   */
  async updateMeeting(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;
      const input = UpdateMeetingSchema.parse(req.body);

      const existing = await prisma.meeting.findFirst({
        where: { id, workspaceId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const updated = await prisma.meeting.update({
        where: { id },
        data: {
          ...(input.title ? { title: input.title } : {}),
          ...(input.participants !== undefined
            ? {
                participants: {
                  deleteMany: {},
                  create: input.participants.map((participant) => ({
                    name: participant.name,
                    email: participant.email || null,
                    role: participant.role || null,
                  })),
                },
              }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.startAt ? { startAt: new Date(input.startAt) } : {}),
          ...(input.endAt !== undefined
            ? { endAt: input.endAt ? new Date(input.endAt) : null }
            : {}),
          ...(input.timezone ? { timezone: input.timezone } : {}),
          ...(input.meetingStatus
            ? { meetingStatus: input.meetingStatus }
            : {}),
        },
        include: {
          project: { include: { company: true } },
          participants: true,
        },
      });

      res.status(200).json({
        success: true,
        data: { ...updated, mediaStorageKey: undefined },
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

  /**
   * DELETE /api/v1/meetings/:id
   * Delete meeting.
   */
  async deleteMeeting(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;

      const existing = await prisma.meeting.findFirst({
        where: { id, workspaceId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      await prisma.meeting.delete({
        where: { id },
      });
      if (existing.mediaStorageKey) await removeMedia(existing.mediaStorageKey);

      res.status(200).json({
        success: true,
        data: { id, deleted: true },
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

  /**
   * POST /api/v1/meetings/:id/transcript
   * Upload or attach transcript to an existing meeting and enqueue processing.
   */
  async uploadTranscript(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;
      const input = UploadTranscriptSchema.parse(req.body);

      const existing = await prisma.meeting.findFirst({
        where: { id, workspaceId },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      await prisma.$transaction([
        prisma.meetingTranscript.create({
          data: {
            meetingId: id,
            rawText: input.rawText,
            sourceFilename: input.sourceFilename,
            sourceFormat: input.sourceFormat,
            parserVersion: '1.0.0',
          },
        }),
        prisma.meeting.update({
          where: { id },
          data: {
            sourceType: 'TRANSCRIPT_UPLOAD',
            processingStatus: 'QUEUED',
          },
        }),
      ]);

      const queueResult = await enqueueMeetingProcessing({
        meetingId: id,
        workspaceId,
      });

      res.status(200).json({
        success: true,
        data: {
          meetingId: id,
          sourceFilename: input.sourceFilename,
          sourceFormat: input.sourceFormat,
          queueStatus: queueResult.status,
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

  /**
   * GET /api/v1/meetings/:id/transcript
   * Get raw transcript and segments.
   */
  async getTranscript(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;

      const meeting = await prisma.meeting.findFirst({
        where: { id, workspaceId },
        include: {
          transcripts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          segments: {
            orderBy: { sequence: 'asc' },
          },
        },
      });

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const latestTranscript = meeting.transcripts[0] || null;

      res.status(200).json({
        success: true,
        data: {
          meetingId: id,
          hasTranscript: Boolean(latestTranscript),
          transcript: latestTranscript,
          segments: meeting.segments,
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

  /**
   * GET /api/v1/meetings/:id/processing
   * Polling endpoint: Get live background processing status.
   */
  async getProcessingStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;

      const meeting = await prisma.meeting.findFirst({
        where: { id, workspaceId },
        select: {
          id: true,
          processingStatus: true,
          meetingStatus: true,
          processingJobs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      const latestJob = meeting.processingJobs[0];
      // Prisma may load the parent and relation in separate queries while a stage commits.
      // The job row carries the coherent stage/progress/terminal result for this response.
      const processingStatus = latestJob
        ? latestJob.status === 'COMPLETED'
          ? 'READY'
          : latestJob.status === 'FAILED'
            ? 'FAILED'
            : latestJob.stage
        : meeting.processingStatus;

      // Estimated progress map by stage
      const stageProgressMap: Record<string, number> = {
        NOT_STARTED: 0,
        QUEUED: 5,
        PARSING: 25,
        ANALYZING: 60,
        FINALIZING: 90,
        READY: 100,
        FAILED: 0,
      };

      const stage = latestJob?.stage || processingStatus;
      const progress =
        latestJob?.progress ?? (stageProgressMap[processingStatus] || 0);

      res.status(200).json({
        success: true,
        data: {
          meetingId: id,
          processingStatus,
          stage,
          progress,
          attempts: latestJob?.attempts ?? 0,
          errorCode: latestJob?.errorCode ?? null,
          startedAt: latestJob?.startedAt ?? null,
          completedAt: latestJob?.completedAt ?? null,
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

  /**
   * POST /api/v1/meetings/:id/reprocess
   * Trigger reprocessing for a meeting with existing transcript.
   */
  async reprocessMeeting(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { id } = req.params;

      const meeting = await prisma.meeting.findFirst({
        where: { id, workspaceId },
        include: {
          transcripts: {
            take: 1,
          },
        },
      });

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      if (meeting.transcripts.length === 0 && !meeting.mediaStorageKey) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_TRANSCRIPT_TO_REPROCESS',
            message: 'Cannot reprocess meeting without an uploaded transcript.',
          },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        });
        return;
      }

      // Claim only terminal/idle meetings. A concurrent retry must not reset a running job.
      await prisma.meeting.updateMany({
        where: {
          id,
          workspaceId,
          processingStatus: { in: ['READY', 'FAILED', 'NOT_STARTED'] },
        },
        data: { processingStatus: 'QUEUED' },
      });
      const queueResult = await enqueueMeetingProcessing({
        meetingId: id,
        workspaceId,
      });

      res.status(200).json({
        success: true,
        data: {
          meetingId: id,
          processingStatus:
            queueResult.status === 'REDIS_UNAVAILABLE' ? 'FAILED' : 'QUEUED',
          queueStatus: queueResult.status,
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

export const meetingsController = new MeetingsController();
