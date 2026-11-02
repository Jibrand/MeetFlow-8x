import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';
import { generateAccessToken } from '../../lib/security';
import { enqueueMeetingProcessing } from '../../queues/meeting-processing.queue';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    meeting: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      delete: vi.fn(),
      count: vi.fn(),
    },
    meetingTranscript: {
      create: vi.fn(),
    },
    transcriptSegment: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    meetingProcessingJob: {
      upsert: vi.fn(),
    },
    actionItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fnOrArray) => {
      if (typeof fnOrArray === 'function') {
        return fnOrArray(prisma);
      }
      return Promise.all(fnOrArray);
    }),
  },
}));

vi.mock('../../queues/meeting-processing.queue', () => ({
  enqueueMeetingProcessing: vi.fn().mockResolvedValue({
    jobId: 'mock-job-1',
    status: 'QUEUED',
  }),
}));

describe('Meetings and Workspace Authorization Integration Tests', () => {
  const app = createApp();

  const user1 = { userId: 'user-workspace-1', email: 'user1@meetflow.ai' };
  const tokenUser1 = generateAccessToken(user1);

  const user2 = { userId: 'user-workspace-2', email: 'user2@meetflow.ai' };
  const tokenUser2 = generateAccessToken(user2);

  const workspace1Id = 'ws-1111';
  const workspace2Id = 'ws-2222';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default workspace resolution for user1 -> workspace1
    const workspaceMemberMock = async (args: { where?: { userId?: unknown } } | undefined) => {
      if (args?.where?.userId === user1.userId) {
        return {
          id: 'wm-1',
          userId: user1.userId,
          workspaceId: workspace1Id,
          role: 'OWNER',
          createdAt: new Date(),
          workspace: { id: workspace1Id, name: 'Workspace 1', slug: 'ws-1' },
        } as any;
      }
      if (args?.where?.userId === user2.userId) {
        return {
          id: 'wm-2',
          userId: user2.userId,
          workspaceId: workspace2Id,
          role: 'OWNER',
          createdAt: new Date(),
          workspace: { id: workspace2Id, name: 'Workspace 2', slug: 'ws-2' },
        } as any;
      }
      return null;
    };
    vi.mocked(prisma.workspaceMember.findFirst).mockImplementation(workspaceMemberMock as unknown as typeof prisma.workspaceMember.findFirst);
  });

  describe('POST /api/v1/meetings', () => {
    it('reports a coherent terminal polling response when the job completes between relation reads', async () => {
      vi.mocked(prisma.meeting.findFirst).mockResolvedValue({
        id: 'meeting-123', processingStatus: 'FINALIZING',
        processingJobs: [{ status: 'COMPLETED', stage: 'COMPLETED', progress: 100, attempts: 1 }],
      } as unknown as Awaited<ReturnType<typeof prisma.meeting.findFirst>>);
      const res = await request(app).get('/api/v1/meetings/meeting-123/processing')
        .set('Cookie', [`meetflow_access_token=${tokenUser1}`]);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ processingStatus: 'READY', progress: 100, attempts: 1 });
    });
    it('creates meeting with transcript and sets status to QUEUED', async () => {
      const mockCreatedMeeting = {
        id: 'meeting-123',
        workspaceId: workspace1Id,
        createdById: user1.userId,
        title: 'Q4 Product Roadmap Sync',
        description: 'Roadmap planning',
        startAt: new Date('2026-11-15T10:00:00Z'),
        endAt: new Date('2026-11-15T11:00:00Z'),
        timezone: 'America/New_York',
        meetingStatus: 'SCHEDULED',
        processingStatus: 'QUEUED',
        sourceType: 'TRANSCRIPT_UPLOAD',
        participants: [{ id: 'p-1', name: 'Sarah Connor', email: 'sarah@skynet.ai' }],
      };

      vi.mocked(prisma.meeting.create).mockResolvedValue(mockCreatedMeeting as any);
      vi.mocked(prisma.meetingTranscript.create).mockResolvedValue({ id: 'tr-1' } as any);

      const res = await request(app)
        .post('/api/v1/meetings')
        .set('Cookie', [`meetflow_access_token=${tokenUser1}`])
        .send({
          title: 'Q4 Product Roadmap Sync',
          description: 'Roadmap planning',
          startAt: '2026-11-15T10:00:00Z',
          endAt: '2026-11-15T11:00:00Z',
          timezone: 'America/New_York',
          participants: [{ name: 'Sarah Connor', email: 'sarah@skynet.ai' }],
          transcript: {
            rawText: '[00:00:05] Sarah: We should launch next Friday.',
            sourceFilename: 'roadmap.txt',
            sourceFormat: 'txt',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('meeting-123');
      expect(res.body.data.processingStatus).toBe('QUEUED');
      expect(res.body.data.queueStatus).toBe('QUEUED');
    });

    it('creates scheduled meeting without transcript', async () => {
      const mockCreatedMeeting = {
        id: 'meeting-456',
        workspaceId: workspace1Id,
        createdById: user1.userId,
        title: 'Upcoming Sprint Planning',
        startAt: new Date('2026-11-20T14:00:00Z'),
        meetingStatus: 'SCHEDULED',
        processingStatus: 'NOT_STARTED',
        sourceType: 'MANUAL',
        participants: [],
      };

      vi.mocked(prisma.meeting.create).mockResolvedValue(mockCreatedMeeting as any);

      const res = await request(app)
        .post('/api/v1/meetings')
        .set('Cookie', [`meetflow_access_token=${tokenUser1}`])
        .send({
          title: 'Upcoming Sprint Planning',
          startAt: '2026-11-20T14:00:00Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processingStatus).toBe('NOT_STARTED');
      expect(res.body.data.queueStatus).toBe('NOT_QUEUED');
    });
  });

  describe('Workspace Isolation: GET /api/v1/meetings and GET /api/v1/meetings/:id', () => {
    it('only lists meetings scoped to the authenticated workspace', async () => {
      vi.mocked(prisma.meeting.count).mockResolvedValue(1);
      vi.mocked(prisma.meeting.findMany).mockResolvedValue([
        {
          id: 'meeting-123',
          workspaceId: workspace1Id,
          title: 'Workspace 1 Meeting',
          startAt: new Date(),
          meetingStatus: 'SCHEDULED',
          processingStatus: 'READY',
          sourceType: 'MANUAL',
          participants: [],
          _count: { actionItems: 0, segments: 0, transcripts: 0 },
        } as any,
      ]);

      const res = await request(app)
        .get('/api/v1/meetings')
        .set('Cookie', [`meetflow_access_token=${tokenUser1}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ workspaceId: workspace1Id }),
        })
      );
    });

    it('rejects access when user tries to access a meeting belonging to another workspace', async () => {
      // User 2 tries to fetch meeting belonging to workspace 1
      vi.mocked(prisma.meeting.findFirst).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/meetings/meeting-123')
        .set('Cookie', [`meetflow_access_token=${tokenUser2}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MEETING_NOT_FOUND');
      expect(prisma.meeting.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'meeting-123', workspaceId: workspace2Id },
        })
      );
    });
  });

  describe('GET /api/v1/meetings/:id/processing', () => {
    it('claims only idle/terminal meetings before retry dispatch and reports Redis failure honestly', async () => {
      vi.mocked(prisma.meeting.findFirst).mockResolvedValue({ id: 'meeting-123', processingStatus: 'READY', transcripts: [{}] } as unknown as Awaited<ReturnType<typeof prisma.meeting.findFirst>>);
      vi.mocked(enqueueMeetingProcessing).mockResolvedValueOnce({ jobId: 'meeting-process-meeting-123', status: 'REDIS_UNAVAILABLE' });
      const res = await request(app).post('/api/v1/meetings/meeting-123/reprocess')
        .set('Cookie', [`meetflow_access_token=${tokenUser1}`]);
      expect(res.status).toBe(200);
      expect(prisma.meeting.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ processingStatus: { in: ['READY', 'FAILED', 'NOT_STARTED'] } }) }));
      expect(res.body.data).toMatchObject({ processingStatus: 'FAILED', queueStatus: 'REDIS_UNAVAILABLE' });
    });
    it('returns live processing progress and stage', async () => {
      vi.mocked(prisma.meeting.findFirst).mockResolvedValue({
        id: 'meeting-123',
        processingStatus: 'ANALYZING',
        meetingStatus: 'SCHEDULED',
        processingJobs: [
          {
            stage: 'ANALYZING',
            progress: 60,
            attempts: 1,
            errorCode: null,
            startedAt: new Date(),
            completedAt: null,
          },
        ],
      } as any);

      const res = await request(app)
        .get('/api/v1/meetings/meeting-123/processing')
        .set('Cookie', [`meetflow_access_token=${tokenUser1}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.stage).toBe('ANALYZING');
      expect(res.body.data.progress).toBe(60);
    });
  });
});
