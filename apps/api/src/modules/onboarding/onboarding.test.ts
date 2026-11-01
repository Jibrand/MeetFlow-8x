import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';
import { generateAccessToken } from '../../lib/security';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    workspace: {
      create: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      findFirst: vi.fn(),
    },
    userOnboarding: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    authSession: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Onboarding and Workspaces Module Integration Tests', () => {
  const app = createApp();
  const token = generateAccessToken({ userId: 'u-123', email: 'test@example.com' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/onboarding', () => {
    it('returns onboarding status with role and primary use cases', async () => {
      vi.mocked(prisma.userOnboarding.findUnique).mockResolvedValue({
        id: 'ob-1',
        userId: 'u-123',
        professionalRole: 'Product Manager',
        primaryUseCases: ['Action items', 'Executive summaries'],
        currentStep: 2,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: 'wm-1',
        userId: 'u-123',
        workspaceId: 'ws-1',
        role: 'OWNER',
        createdAt: new Date(),
        workspace: {
          id: 'ws-1',
          name: 'Acme Product',
          slug: 'acme-product',
          organizationName: 'Acme Inc.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any);

      const res = await request(app)
        .get('/api/v1/onboarding')
        .set('Cookie', [`meetflow_access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.professionalRole).toBe('Product Manager');
      expect(res.body.data.selectedUseCases).toContain('Action items');
      expect(res.body.data.workspace.name).toBe('Acme Product');
      expect(res.body.data.googleConnected).toBe(false);
    });
  });

  describe('PATCH /api/v1/onboarding', () => {
    it('persists role and use case selection', async () => {
      vi.mocked(prisma.userOnboarding.upsert).mockResolvedValue({
        id: 'ob-1',
        userId: 'u-123',
        professionalRole: 'Engineering',
        primaryUseCases: ['Automated notes'],
        currentStep: 3,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .patch('/api/v1/onboarding')
        .set('Cookie', [`meetflow_access_token=${token}`])
        .send({
          professionalRole: 'Engineering',
          primaryUseCases: ['Automated notes'],
          currentStep: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStep).toBe(3);
      expect(res.body.data.professionalRole).toBe('Engineering');
    });
  });

  describe('POST /api/v1/onboarding/workspace', () => {
    it('updates workspace and advances step to 4', async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: 'wm-1',
        userId: 'u-123',
        workspaceId: 'ws-1',
        role: 'OWNER',
        workspace: { id: 'ws-1', name: 'Old Name' },
      } as any);
      vi.mocked(prisma.workspace.update).mockResolvedValue({
        id: 'ws-1',
        name: 'Growth Team Workspace',
        organizationName: 'Growth Labs',
      } as any);
      vi.mocked(prisma.userOnboarding.upsert).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/onboarding/workspace')
        .set('Cookie', [`meetflow_access_token=${token}`])
        .send({
          workspaceName: 'Growth Team Workspace',
          orgName: 'Growth Labs',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Growth Team Workspace');
      expect(res.body.data.currentStep).toBe(4);
    });
  });

  describe('POST /api/v1/onboarding/complete', () => {
    it('marks onboarding as completed with timestamp', async () => {
      const now = new Date();
      vi.mocked(prisma.userOnboarding.upsert).mockResolvedValue({
        id: 'ob-1',
        userId: 'u-123',
        currentStep: 5,
        completedAt: now,
      } as any);

      const res = await request(app)
        .post('/api/v1/onboarding/complete')
        .set('Cookie', [`meetflow_access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
    });
  });

  describe('PATCH /api/v1/workspaces/current', () => {
    it('enforces OWNER or ADMIN role authorization', async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: 'wm-1',
        userId: 'u-123',
        workspaceId: 'ws-1',
        role: 'MEMBER', // regular member
        workspace: { id: 'ws-1', name: 'Work' },
      } as any);

      const res = await request(app)
        .patch('/api/v1/workspaces/current')
        .set('Cookie', [`meetflow_access_token=${token}`])
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows owner to update workspace details', async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        id: 'wm-1',
        userId: 'u-123',
        workspaceId: 'ws-1',
        role: 'OWNER',
        workspace: { id: 'ws-1', name: 'Work' },
      } as any);
      vi.mocked(prisma.workspace.update).mockResolvedValue({
        id: 'ws-1',
        name: 'New Workspace Name',
        slug: 'new-slug',
        organizationName: 'New Org',
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .patch('/api/v1/workspaces/current')
        .set('Cookie', [`meetflow_access_token=${token}`])
        .send({
          name: 'New Workspace Name',
          organizationName: 'New Org',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Workspace Name');
    });
  });
});
