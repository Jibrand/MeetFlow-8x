import { Queue } from 'bullmq';
import { createRedisConnection, isRedisConfigured } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export const MEETING_PROCESSING_QUEUE_NAME = 'meeting-processing';

export interface MeetingJobPayload {
  meetingId: string;
  workspaceId: string;
}

let queueInstance: Queue<MeetingJobPayload> | null = null;

export function getMeetingProcessingQueue(): Queue<MeetingJobPayload> {
  if (!isRedisConfigured()) {
    throw new Error(
      'REDIS_URL is not configured. BullMQ requires an active Redis instance. Please set REDIS_URL in .env.'
    );
  }

  if (!queueInstance) {
    const connection = createRedisConnection('meetflow-queue-producer');
    queueInstance = new Queue<MeetingJobPayload>(MEETING_PROCESSING_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      },
    });
  }

  return queueInstance;
}

/**
 * Idempotently enqueues a meeting for background processing.
 * Durable state is recorded in Neon PostgreSQL in meeting_processing_jobs.
 */
export async function enqueueMeetingProcessing(params: {
  meetingId: string;
  workspaceId: string;
}): Promise<{ jobId: string; status: 'QUEUED' | 'REDIS_UNAVAILABLE' }> {
  const { meetingId, workspaceId } = params;
  const jobId = `meeting-process-${meetingId}`;

  // 1. Durably record or upsert processing job in Neon
  await prisma.meetingProcessingJob.upsert({
    where: { jobId },
    update: {
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 5,
      errorCode: null,
      updatedAt: new Date(),
    },
    create: {
      meetingId,
      jobId,
      status: 'QUEUED',
      stage: 'QUEUED',
      progress: 5,
      attempts: 0,
    },
  });

  // Update meeting state
  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      processingStatus: 'QUEUED',
    },
  });

  // 2. Enqueue in BullMQ if Redis is configured
  if (isRedisConfigured()) {
    try {
      const queue = getMeetingProcessingQueue();
      await queue.add('process-transcript', { meetingId, workspaceId }, { jobId });
      logger.info('Enqueued meeting processing job in BullMQ', { meetingId, jobId });
      return { jobId, status: 'QUEUED' };
    } catch (err: any) {
      logger.error('Failed to dispatch job to Redis queue, marked for worker polling reconciliation', {
        meetingId,
        error: err.message,
      });
      // The meeting record remains in Neon as QUEUED and can be retried or reconciled
      return { jobId, status: 'REDIS_UNAVAILABLE' };
    }
  } else {
    logger.warn('REDIS_URL not configured. Meeting job saved durably in Neon PostgreSQL as QUEUED.', {
      meetingId,
      jobId,
    });
    return { jobId, status: 'REDIS_UNAVAILABLE' };
  }
}
