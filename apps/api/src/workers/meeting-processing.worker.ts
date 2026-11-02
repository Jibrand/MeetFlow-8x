import '../env';
import { Worker, Job, UnrecoverableError } from 'bullmq';
import { createRedisConnection, isRedisConfigured } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { transcriptParserService } from '../services/transcript-parser.service';
import { meetingAIService } from '../services/meeting-ai.service';
import { transcribeMedia } from '../services/media.service';
import {
  MEETING_PROCESSING_QUEUE_NAME,
  MeetingJobPayload,
} from '../queues/meeting-processing.queue';
import {
  markProcessingFailed,
  processingErrorCode,
} from '../services/processing-state';

/**
 * Core business logic: Process transcript into meeting intelligence.
 * Reusable across BullMQ worker, direct testing, and reconciliation runners.
 */
export async function processMeetingIntelligence(
  meetingId: string,
): Promise<void> {
  logger.info('Starting meeting intelligence pipeline', { meetingId });

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      transcripts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }
  if (meeting.processingStatus === 'FAILED') {
    logger.warn(
      'Skipping cancelled meeting job; use Retry to dispatch a new attempt',
      { meetingId },
    );
    return;
  }

  let transcriptRecord = meeting.transcripts[0];
  if (!transcriptRecord && meeting.mediaStorageKey) {
    await updateJobProgress(meetingId, 'PARSING', 10, 'RUNNING');
    const result = await transcribeMedia(
      meeting.mediaStorageKey,
      (done, total) =>
        updateJobProgress(
          meetingId,
          'PARSING',
          10 + Math.round((4 * done) / total),
          'RUNNING',
        ),
    );
    transcriptRecord = await prisma.meetingTranscript.create({
      data: {
        meetingId,
        rawText: result.rawText,
        sourceFilename: `${meeting.mediaFilename || 'recording'}.vtt`,
        sourceFormat: 'vtt',
        parserVersion: 'media-v1',
      },
    });
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        durationSeconds: result.durationSeconds,
        endAt: new Date(
          meeting.startAt.getTime() + result.durationSeconds * 1000,
        ),
      },
    });
  }
  if (!transcriptRecord || !transcriptRecord.rawText.trim()) {
    throw new UnrecoverableError('NO_TRANSCRIPT_AVAILABLE');
  }

  // --- STAGE 1: PARSING (Progress 10-30%) ---
  logger.info('Stage 1: Parsing transcript', { meetingId });
  await updateJobProgress(meetingId, 'PARSING', 15, 'RUNNING');

  const parseResult = transcriptParserService.parse(
    transcriptRecord.rawText,
    transcriptRecord.sourceFormat,
  );
  if (!parseResult.segments.length)
    throw new UnrecoverableError('NO_TRANSCRIPT_AVAILABLE');

  // Idempotently persist segments in transaction
  await prisma.$transaction(async (tx) => {
    await tx.transcriptSegment.deleteMany({ where: { meetingId } });
    if (parseResult.segments.length > 0) {
      await tx.transcriptSegment.createMany({
        data: parseResult.segments.map((seg) => ({
          meetingId,
          sequence: seg.sequence,
          speakerName: seg.speakerName,
          startMs: seg.startMs,
          endMs: seg.endMs,
          text: seg.text,
        })),
      });
    }
  });

  await updateJobProgress(meetingId, 'PARSING', 30, 'RUNNING');

  // --- STAGE 2: ANALYZING WITH OPENAI (Progress 30-80%) ---
  logger.info('Stage 2: Analyzing with OpenAI', { meetingId });
  await updateJobProgress(meetingId, 'ANALYZING', 45, 'RUNNING');

  const aiResult = await meetingAIService.analyzeMeeting({
    meetingTitle: meeting.title,
    meetingDate: meeting.startAt,
    timezone: meeting.timezone,
    segments: parseResult.segments,
    onProgress: (completed, total) =>
      updateJobProgress(
        meetingId,
        'ANALYZING',
        45 + Math.round((25 * completed) / total),
        'RUNNING',
      ),
  });

  await updateJobProgress(meetingId, 'ANALYZING', 75, 'RUNNING');

  // --- STAGE 3: SAVING STRUCTURED RESULTS & ACTION ITEMS (Progress 80-95%) ---
  logger.info('Stage 3: Persisting structured intelligence', { meetingId });
  await updateJobProgress(meetingId, 'FINALIZING', 85, 'RUNNING');

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.meeting.updateMany({
      where: { id: meetingId, processingStatus: 'FINALIZING' },
      data: { processingStatus: 'FINALIZING' },
    });
    if (!claimed.count) throw new UnrecoverableError('PROCESSING_CANCELLED');
    // 1. Upsert Meeting Summary
    await tx.meetingSummary.upsert({
      where: { meetingId },
      create: {
        meetingId,
        overview: aiResult.overview,
        keyPoints: aiResult.keyPoints,
        decisions: aiResult.decisions,
        topics: aiResult.topics,
        highlights: aiResult.highlights,
        model: aiResult.model,
      },
      update: {
        overview: aiResult.overview,
        keyPoints: aiResult.keyPoints,
        decisions: aiResult.decisions,
        topics: aiResult.topics,
        highlights: aiResult.highlights,
        model: aiResult.model,
        updatedAt: new Date(),
      },
    });

    // 2. Idempotent Action Items creation without duplicating or overwriting manual edits
    const existingActionItems = await tx.actionItem.findMany({
      where: { meetingId },
    });

    const existingTitlesMap = new Map(
      existingActionItems.map((item) => [
        item.title.toLowerCase().trim(),
        item,
      ]),
    );

    for (const extracted of aiResult.actionItems) {
      const normalizedTitle = extracted.title.toLowerCase().trim();
      const existing = existingTitlesMap.get(normalizedTitle);

      if (existing) {
        // If user already touched or completed the task, never overwrite their status
        if (
          existing.source === 'MANUAL' ||
          existing.status === 'DONE' ||
          existing.status === 'IN_PROGRESS'
        ) {
          continue;
        }
        // Update description if still TODO
        await tx.actionItem.update({
          where: { id: existing.id },
          data: {
            description: extracted.description || existing.description,
            assigneeName: extracted.assigneeName || existing.assigneeName,
            dueDate: extracted.dueDate
              ? new Date(extracted.dueDate)
              : existing.dueDate,
          },
        });
      } else {
        // Create new action item
        await tx.actionItem.create({
          data: {
            workspaceId: meeting.workspaceId,
            meetingId,
            title: extracted.title,
            description: extracted.description || null,
            assigneeName: extracted.assigneeName || null,
            dueDate: extracted.dueDate ? new Date(extracted.dueDate) : null,
            status: 'TODO',
            source: 'AI_EXTRACTED',
          },
        });
      }
    }

    // 3. Mark Meeting READY
    await tx.meeting.update({
      where: { id: meetingId },
      data: {
        processingStatus: 'READY',
        meetingStatus: 'COMPLETED',
        ...(parseResult.segments.some((segment) => segment.endMs != null)
          ? {
              durationSeconds: Math.ceil(
                Math.max(
                  ...parseResult.segments.map((segment) => segment.endMs ?? 0),
                ) / 1000,
              ),
            }
          : {}),
      },
    });

    // 4. Mark Job COMPLETED (100%)
    await tx.meetingProcessingJob.upsert({
      where: { jobId: `meeting-process-${meetingId}` },
      update: {
        status: 'COMPLETED',
        stage: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
        errorCode: null,
      },
      create: {
        meetingId,
        jobId: `meeting-process-${meetingId}`,
        status: 'COMPLETED',
        stage: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
      },
    });
  });

  logger.info('Meeting intelligence processing completed successfully', {
    meetingId,
  });
}

async function updateJobProgress(
  meetingId: string,
  stage: 'QUEUED' | 'PARSING' | 'ANALYZING' | 'FINALIZING',
  progress: number,
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED',
): Promise<void> {
  const jobId = `meeting-process-${meetingId}`;
  await prisma.$transaction(async (tx) => {
    const changed = await tx.meeting.updateMany({
      where: {
        id: meetingId,
        processingStatus: {
          in: ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'],
        },
      },
      data: { processingStatus: stage },
    });
    if (!changed.count) throw new UnrecoverableError('PROCESSING_CANCELLED');
    await tx.meetingProcessingJob.upsert({
      where: { jobId },
      update: {
        stage,
        progress,
        status,
      },
      create: {
        meetingId,
        jobId,
        stage,
        progress,
        status,
        startedAt: status === 'RUNNING' ? new Date() : undefined,
      },
    });
  });
}

/**
 * Standalone BullMQ Worker entry point
 */
export function startMeetingProcessingWorker(): Worker<MeetingJobPayload> | null {
  if (!isRedisConfigured()) {
    logger.error(
      'Cannot start BullMQ worker: REDIS_URL is not configured in .env. ' +
        'Please configure REDIS_URL to enable background worker processing.',
    );
    return null;
  }

  const connection = createRedisConnection('meetflow-worker');

  const worker = new Worker<MeetingJobPayload>(
    MEETING_PROCESSING_QUEUE_NAME,
    async (job: Job<MeetingJobPayload>) => {
      const { meetingId } = job.data;
      logger.info(`[Worker] Processing job ${job.id} for meeting ${meetingId}`);

      try {
        await prisma.$transaction(async (tx) => {
          const claimed = await tx.meeting.updateMany({
            where: {
              id: meetingId,
              processingStatus: {
                in: ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'],
              },
            },
            data: { processingStatus: 'PARSING' },
          });
          if (!claimed.count)
            throw new UnrecoverableError('PROCESSING_CANCELLED');
          await tx.meetingProcessingJob.update({
            where: { jobId: `meeting-process-${meetingId}` },
            data: {
              attempts: job.attemptsMade + 1,
              startedAt: new Date(),
              completedAt: null,
              errorCode: null,
            },
          });
        });
        await processMeetingIntelligence(meetingId);
      } catch (err: unknown) {
        logger.error(`[Worker] Job ${job.id} failed`, {
          meetingId,
          error: err instanceof Error ? err : String(err),
          attemptsMade: job.attemptsMade,
        });

        const isLastAttempt =
          err instanceof UnrecoverableError ||
          job.attemptsMade >= (job.opts.attempts || 1) - 1;
        if (isLastAttempt) {
          await markProcessingFailed(meetingId, processingErrorCode(err));
        } else {
          await prisma.$transaction(async (tx) => {
            const changed = await tx.meeting.updateMany({
              where: {
                id: meetingId,
                processingStatus: {
                  in: ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'],
                },
              },
              data: { processingStatus: 'QUEUED' },
            });
            if (!changed.count)
              throw new UnrecoverableError('PROCESSING_CANCELLED');
            await tx.meetingProcessingJob.update({
              where: { jobId: `meeting-process-${meetingId}` },
              data: {
                status: 'QUEUED',
                stage: 'QUEUED',
                progress: 5,
                errorCode: processingErrorCode(err),
              },
            });
          });
        }
        throw err;
      }
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on('ready', () => {
    logger.info(
      'BullMQ Meeting Processing Worker is running and ready for jobs.',
    );
  });

  worker.on('failed', (job, err) => {
    logger.warn(`Job ${job?.id} attempt failed`, { error: err.message });
  });
  worker.on('error', (error) =>
    logger.error('Meeting worker error', { error: error.message }),
  );
  worker.on('stalled', (jobId) =>
    logger.warn('Recovering stalled meeting job', { jobId }),
  );

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down BullMQ worker gracefully...');
    await worker.close();
    connection.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };

  if (process.argv[1]?.includes('meeting-processing.worker')) {
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  return worker;
}

// If executed directly as standalone process
if (process.argv[1]?.includes('meeting-processing.worker')) {
  if (!startMeetingProcessingWorker()) process.exitCode = 1;
}
