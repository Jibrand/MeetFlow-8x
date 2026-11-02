import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { createRedisConnection, isRedisConfigured } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { markProcessingFailed } from '../services/processing-state';

export const MEETING_PROCESSING_QUEUE_NAME = 'meeting-processing';
export interface MeetingJobPayload {
  summaryVariantId?: string;
  generationId?: string;
  meetingId: string;
  workspaceId: string;
}
let queueInstance: Queue<MeetingJobPayload> | null = null;
let producerConnection: Redis | null = null;

export function getMeetingProcessingQueue(): Queue<MeetingJobPayload> {
  if (!isRedisConfigured()) throw new Error('REDIS_URL is not configured.');
  if (!queueInstance) {
    producerConnection = createRedisConnection('meetflow-queue-producer', true);
    queueInstance = new Queue<MeetingJobPayload>(
      MEETING_PROCESSING_QUEUE_NAME,
      {
        connection: producerConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 100 },
        },
      },
    );
    let lastError = '';
    queueInstance.on('error', (error) => {
      if (lastError !== error.message)
        logger.error('Meeting queue error', { error: error.message });
      lastError = error.message;
    });
  }
  return queueInstance;
}

export async function closeMeetingProcessingQueue(): Promise<void> {
  const queue = queueInstance;
  queueInstance = null;
  producerConnection?.disconnect();
  producerConnection = null;
  await queue?.close();
}

export async function withQueueDeadline<T>(
  operation: () => Promise<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Redis queue timed out')),
          5000,
        );
      }),
    ]);
  } catch (error) {
    // Disconnect so a timed-out enqueue cannot silently dispatch later.
    await closeMeetingProcessingQueue();
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function enqueueMeetingProcessing(
  params: MeetingJobPayload,
): Promise<{ jobId: string; status: 'QUEUED' | 'REDIS_UNAVAILABLE' }> {
  const { meetingId, workspaceId } = params;
  const jobId = `meeting-process-${meetingId}`;
  try {
    const queue = getMeetingProcessingQueue();
    await withQueueDeadline(() => queue.waitUntilReady());
    const existing = await withQueueDeadline(() => queue.getJob(jobId));
    if (existing) {
      const state = await withQueueDeadline(() => existing.getState());
      // Never reset progress or dispatch a duplicate while the same meeting is running.
      if (!['completed', 'failed', 'unknown'].includes(state))
        return { jobId, status: 'QUEUED' as const };
      await withQueueDeadline(() => existing.remove());
    }
    // Persist before dispatch: a fast worker must not have READY overwritten by QUEUED.
    await prisma.$transaction([
      prisma.meetingProcessingJob.upsert({
        where: { jobId },
        update: {
          status: 'QUEUED',
          stage: 'QUEUED',
          progress: 5,
          attempts: 0,
          errorCode: null,
          startedAt: null,
          completedAt: null,
        },
        create: {
          meetingId,
          jobId,
          status: 'QUEUED',
          stage: 'QUEUED',
          progress: 5,
          attempts: 0,
        },
      }),
      prisma.meeting.update({
        where: { id: meetingId },
        data: { processingStatus: 'QUEUED' },
      }),
    ]);
    await withQueueDeadline(() =>
      queue.add('process-transcript', { meetingId, workspaceId }, { jobId }),
    );
    logger.info('Meeting queued', { meetingId });
    return { jobId, status: 'QUEUED' as const };
  } catch (error) {
    logger.error('Could not queue meeting', {
      meetingId,
      error: error instanceof Error ? error.message : 'Unknown queue error',
    });
    await markProcessingFailed(
      meetingId,
      'REDIS_UNAVAILABLE: Check REDIS_URL and Redis connectivity, then retry processing.',
    );
    return { jobId, status: 'REDIS_UNAVAILABLE' };
  }
}

// The API owns this watchdog; it also detects a worker that was never started.
export async function reconcileMeetingProcessing(): Promise<void> {
  const stale = await prisma.meeting.findMany({
    where: {
      processingStatus: {
        in: ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'],
      },
      updatedAt: { lt: new Date(Date.now() - 30_000) },
    },
    select: {
      id: true,
      workspaceId: true,
      processingStatus: true,
      updatedAt: true,
    },
    take: 100,
    orderBy: { updatedAt: 'asc' },
  });
  if (!stale.length) return;
  let queue: Queue<MeetingJobPayload>;
  let workers: number;
  try {
    ({ queue, workers } = await withQueueDeadline(async () => {
      const queue = getMeetingProcessingQueue();
      await queue.waitUntilReady();
      return { queue, workers: (await queue.getWorkers()).length };
    }));
  } catch {
    for (const meeting of stale) {
      // Allow an active analysis to finish during a short Redis outage.
      if (
        meeting.processingStatus === 'QUEUED' ||
        Date.now() - meeting.updatedAt.getTime() > 600_000
      ) {
        await markProcessingFailed(
          meeting.id,
          'REDIS_UNAVAILABLE: Queue connection was lost. Restore Redis and retry.',
          meeting.updatedAt,
        );
      }
    }
    return;
  }
  for (const meeting of stale) {
    const fail = (reason: string) =>
      markProcessingFailed(meeting.id, reason, meeting.updatedAt);
    const job = await withQueueDeadline(() =>
      queue.getJob(`meeting-process-${meeting.id}`),
    );
    const state = job
      ? await withQueueDeadline(() => job.getState())
      : 'missing';
    if (state === 'failed') {
      await fail(
        'WORKER_JOB_FAILED: The queue job failed or exhausted stalled-job recovery. Retry processing.',
      );
    } else if (state === 'completed') {
      // READY and completion are committed together by the processor; this indicates inconsistent legacy state.
      await fail(
        'PROCESSING_STATE_MISMATCH: Queue finished without saved results. Retry processing.',
      );
    } else if (!workers && state !== 'active') {
      if (job) await withQueueDeadline(() => job.remove());
      await fail(
        'WORKER_UNAVAILABLE: No processing worker is running. Start pnpm dev or pnpm worker, then retry.',
      );
    } else if (
      state === 'active' &&
      Date.now() - meeting.updatedAt.getTime() > 600_000
    ) {
      await fail(
        'PROCESSING_TIMEOUT: The worker made no progress for ten minutes. Restart the worker and retry.',
      );
    } else if (await withQueueDeadline(() => queue.isPaused())) {
      if (job && state !== 'active')
        await withQueueDeadline(() => job.remove());
      if (state !== 'active')
        await fail('QUEUE_PAUSED: Resume the processing queue, then retry.');
    } else if (state === 'missing') {
      await enqueueMeetingProcessing({
        meetingId: meeting.id,
        workspaceId: meeting.workspaceId,
      });
    }
  }
}
