import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import type { MeetingJobPayload } from '../queues/meeting-processing.queue';

const mocks = vi.hoisted(() => {
  const db = {
    meeting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    meetingProcessingJob: { upsert: vi.fn(), update: vi.fn() },
    transcriptSegment: { deleteMany: vi.fn(), createMany: vi.fn() },
    meetingSummary: { upsert: vi.fn() },
    actionItem: { findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };
  return {
    db,
    configured: true,
    analyze: vi.fn(),
    disconnect: vi.fn(),
    processor: null as null | ((job: Job<MeetingJobPayload>) => Promise<void>),
    queue: {
      on: vi.fn(),
      waitUntilReady: vi.fn(),
      getJob: vi.fn(),
      add: vi.fn(),
      close: vi.fn(),
      getWorkers: vi.fn(),
      isPaused: vi.fn(),
    },
  };
});
vi.mock('../lib/prisma', () => ({ prisma: mocks.db }));
vi.mock('../lib/redis', () => ({
  isRedisConfigured: () => mocks.configured,
  createRedisConnection: () => ({ disconnect: mocks.disconnect }),
}));
vi.mock('../services/meeting-ai.service', () => ({
  meetingAIService: { analyzeMeeting: mocks.analyze },
}));
vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('bullmq', async (importOriginal) => {
  const actual = await importOriginal<typeof import('bullmq')>();
  return {
    ...actual,
    Queue: class {
      constructor() {
        return mocks.queue;
      }
    },
    Worker: class {
      constructor(
        _name: string,
        processor: (job: Job<MeetingJobPayload>) => Promise<void>,
      ) {
        mocks.processor = processor;
      }
      on = vi.fn();
    },
  };
});

import {
  enqueueMeetingProcessing,
  closeMeetingProcessingQueue,
  reconcileMeetingProcessing,
} from '../queues/meeting-processing.queue';
import { startMeetingProcessingWorker } from './meeting-processing.worker';

const meetingId = 'meeting-test';
const oldDate = new Date(Date.now() - 120_000);
function job(attemptsMade = 0): Job<MeetingJobPayload> {
  return {
    id: `meeting-process-${meetingId}`,
    data: { meetingId, workspaceId: 'ws' },
    attemptsMade,
    opts: { attempts: 3 },
  } as Job<MeetingJobPayload>;
}

beforeEach(async () => {
  await closeMeetingProcessingQueue();
  vi.resetAllMocks();
  mocks.configured = true;
  mocks.db.$transaction.mockImplementation((operation) =>
    typeof operation === 'function'
      ? operation(mocks.db)
      : Promise.all(operation),
  );
  mocks.db.meeting.updateMany.mockResolvedValue({ count: 1 });
  mocks.db.meeting.findMany.mockResolvedValue([]);
  mocks.db.meeting.findUnique.mockResolvedValue({
    id: meetingId,
    workspaceId: 'ws',
    title: 'Real transcript test',
    startAt: new Date(),
    timezone: 'UTC',
    processingStatus: 'QUEUED',
    transcripts: [
      {
        rawText:
          'Alice: We agreed to ship the release.\nBob: I will send the release notes.',
        sourceFormat: 'txt',
      },
    ],
  });
  mocks.db.actionItem.findMany.mockResolvedValue([]);
  mocks.queue.getWorkers.mockResolvedValue([{}]);
  mocks.queue.isPaused.mockResolvedValue(false);
  mocks.analyze.mockResolvedValue({
    overview: 'The release was agreed.',
    keyPoints: ['Ship the release'],
    decisions: ['Release approved'],
    topics: ['Release'],
    highlights: [],
    actionItems: [
      {
        title: 'Send release notes',
        description: '',
        assigneeName: 'Bob',
        dueDate: null,
      },
    ],
    model: 'test-model',
  });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Meeting queue and processing lifecycle', () => {
  it('fails a worker with no progress for ten minutes even if its Redis connection is alive', async () => {
    mocks.db.meeting.findMany.mockResolvedValue([
      {
        id: meetingId,
        updatedAt: new Date(Date.now() - 660_000),
        processingStatus: 'ANALYZING',
      },
    ]);
    mocks.queue.getJob.mockResolvedValue({ getState: () => 'active' });
    await reconcileMeetingProcessing();
    expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          errorCode: expect.stringContaining('PROCESSING_TIMEOUT'),
        }),
      }),
    );
  });

  it('does not revive a timed-out meeting when a late processor resumes', async () => {
    mocks.db.meeting.updateMany.mockResolvedValue({ count: 0 });
    startMeetingProcessingWorker();
    await expect(mocks.processor!(job())).rejects.toThrow(
      'PROCESSING_CANCELLED',
    );
    expect(mocks.db.meeting.update).not.toHaveBeenCalled();
    expect(mocks.analyze).not.toHaveBeenCalled();
  });
  it('preserves manually created or edited action items during reprocessing', async () => {
    mocks.db.actionItem.findMany.mockResolvedValue([
      {
        id: 'manual-action',
        title: 'Send release notes',
        source: 'MANUAL',
        status: 'TODO',
      },
    ]);
    startMeetingProcessingWorker();
    await mocks.processor!(job());
    expect(mocks.db.actionItem.update).not.toHaveBeenCalled();
    expect(mocks.db.actionItem.create).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'AI_AUTH_FAILED'],
    [429, 'AI_RATE_LIMITED'],
  ])(
    'persists actionable provider failure %s without storing its payload',
    async (status, expectedCode) => {
      startMeetingProcessingWorker();
      mocks.analyze.mockRejectedValue(
        Object.assign(new Error('Provider request failed'), { status }),
      );
      await expect(mocks.processor!(job(2))).rejects.toThrow(
        'Provider request failed',
      );
      expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'FAILED',
            errorCode: expect.stringContaining(String(expectedCode)),
          }),
        }),
      );
    },
  );
  it('persists QUEUED before enqueue, then parses and saves real results before READY', async () => {
    await expect(
      enqueueMeetingProcessing({ meetingId, workspaceId: 'ws' }),
    ).resolves.toMatchObject({ status: 'QUEUED' });
    expect(
      mocks.db.meetingProcessingJob.upsert.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.queue.add.mock.invocationCallOrder[0]);
    startMeetingProcessingWorker();
    await mocks.processor!(job());
    expect(mocks.db.transcriptSegment.createMany).toHaveBeenCalled();
    expect(mocks.analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        segments: expect.arrayContaining([
          expect.objectContaining({ speakerName: 'Alice' }),
        ]),
      }),
    );
    expect(mocks.db.meetingSummary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          overview: 'The release was agreed.',
        }),
      }),
    );
    expect(mocks.db.actionItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Send release notes',
          source: 'AI_EXTRACTED',
        }),
      }),
    );
    expect(mocks.db.meeting.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processingStatus: 'READY' }),
      }),
    );
    expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: 'COMPLETED',
          progress: 100,
          errorCode: null,
        }),
      }),
    );
  });

  it('marks a missing Redis configuration FAILED instead of leaving a 5% queue record', async () => {
    mocks.configured = false;
    await expect(
      enqueueMeetingProcessing({ meetingId, workspaceId: 'ws' }),
    ).resolves.toMatchObject({ status: 'REDIS_UNAVAILABLE' });
    expect(mocks.queue.add).not.toHaveBeenCalled();
    expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          stage: 'FAILED',
          errorCode: expect.stringContaining('REDIS_UNAVAILABLE'),
        }),
      }),
    );
  });

  it('fails a hung Redis enqueue within five seconds and disconnects the producer', async () => {
    vi.useFakeTimers();
    mocks.queue.add.mockImplementation(() => new Promise(() => {}));
    const result = enqueueMeetingProcessing({ meetingId, workspaceId: 'ws' });
    await vi.advanceTimersByTimeAsync(5001);
    await expect(result).resolves.toMatchObject({
      status: 'REDIS_UNAVAILABLE',
    });
    expect(mocks.disconnect).toHaveBeenCalled();
  });

  it.each(['completed', 'failed'])(
    'reprocesses a retained %s BullMQ job instead of being deduplicated away',
    async (state) => {
      const remove = vi.fn();
      mocks.queue.getJob.mockResolvedValue({ getState: () => state, remove });
      await enqueueMeetingProcessing({ meetingId, workspaceId: 'ws' });
      expect(remove).toHaveBeenCalledOnce();
      expect(mocks.queue.add).toHaveBeenCalledOnce();
    },
  );

  it('does not duplicate an active job or reset its database progress', async () => {
    mocks.queue.getJob.mockResolvedValue({ getState: () => 'active' });
    await enqueueMeetingProcessing({ meetingId, workspaceId: 'ws' });
    expect(mocks.queue.add).not.toHaveBeenCalled();
    expect(mocks.db.meeting.update).not.toHaveBeenCalled();
  });

  it('records retry progress and attempt count, and marks the final attempt FAILED with an actionable error', async () => {
    startMeetingProcessingWorker();
    mocks.analyze.mockRejectedValue(
      new Error('OPENAI_API_KEY is not configured'),
    );
    await expect(mocks.processor!(job())).rejects.toThrow('OPENAI_API_KEY');
    expect(mocks.db.meetingProcessingJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'QUEUED',
          errorCode: expect.stringContaining('AI_NOT_CONFIGURED'),
        }),
      }),
    );
    await expect(mocks.processor!(job(2))).rejects.toThrow('OPENAI_API_KEY');
    expect(mocks.db.meetingProcessingJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ attempts: 3 }),
      }),
    );
    expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: 'FAILED',
          errorCode: expect.stringContaining('AI_NOT_CONFIGURED'),
        }),
      }),
    );
  });

  it('fails a missing transcript without consuming three attempts', async () => {
    mocks.db.meeting.findUnique.mockResolvedValue({
      processingStatus: 'QUEUED',
      transcripts: [],
    });
    startMeetingProcessingWorker();
    await expect(mocks.processor!(job())).rejects.toThrow(
      'NO_TRANSCRIPT_AVAILABLE',
    );
    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: 'FAILED',
          errorCode: expect.stringContaining('NO_TRANSCRIPT_AVAILABLE'),
        }),
      }),
    );
  });

  it('detects a missing worker and removes its waiting job before exposing a useful failure', async () => {
    mocks.db.meeting.findMany.mockResolvedValue([
      { id: meetingId, updatedAt: oldDate, processingStatus: 'QUEUED' },
    ]);
    mocks.queue.getWorkers.mockResolvedValue([]);
    const remove = vi.fn();
    mocks.queue.getJob.mockResolvedValue({ getState: () => 'waiting', remove });
    await reconcileMeetingProcessing();
    expect(remove).toHaveBeenCalledOnce();
    expect(mocks.db.meetingProcessingJob.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          errorCode: expect.stringContaining('WORKER_UNAVAILABLE'),
        }),
      }),
    );
  });

  it('reconciles a permanently stalled queue failure and never overwrites a concurrently completed meeting', async () => {
    mocks.db.meeting.findMany.mockResolvedValue([
      { id: meetingId, updatedAt: oldDate, processingStatus: 'PARSING' },
    ]);
    mocks.queue.getJob.mockResolvedValue({ getState: () => 'failed' });
    mocks.db.meeting.updateMany.mockResolvedValue({ count: 0 });
    await reconcileMeetingProcessing();
    expect(mocks.db.meeting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ updatedAt: oldDate }),
      }),
    );
    expect(mocks.db.meetingProcessingJob.upsert).not.toHaveBeenCalled();
  });
});
