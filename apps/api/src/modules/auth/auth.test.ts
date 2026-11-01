import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';
import { hashPassword, generateAccessToken } from '../../lib/security';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    workspace: {
      create: vi.fn(),
      update: vi.fn(),
    },
    workspaceMember: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    userOnboarding: {
      create: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    authSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Auth Module Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a new user, creates workspace, and sets auth cookies', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          user: {
            create: vi.fn().mockResolvedValue({
              id: 'u-123',
              name: 'Sarah Connor',
              email: 'sarah@skynet.ai',
              avatarUrl: null,
              role: 'MEMBER',
            }),
          },
          workspace: {
            create: vi.fn().mockResolvedValue({
              id: 'ws-123',
              name: "Sarah Connor's Workspace",
              slug: 'sarah-connors-workspace-xyz',
            }),
          },
          workspaceMember: {
            create: vi.fn().mockResolvedValue({
              id: 'wm-123',
              userId: 'u-123',
              workspaceId: 'ws-123',
              role: 'OWNER',
            }),
          },
          userOnboarding: {
            create: vi.fn().mockResolvedValue({
              id: 'ob-123',
              userId: 'u-123',
              currentStep: 1,
              completedAt: null,
              professionalRole: null,
              primaryUseCases: [],
            }),
          },
        });
      });
      vi.mocked(prisma.authSession.create).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@skynet.ai',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('sarah@skynet.ai');
      expect(res.body.data.workspace.role).toBe('OWNER');
      expect(res.body.data.onboarding.completed).toBe(false);

      // Verify Set-Cookie headers
      const cookies = (res.headers['set-cookie'] || []) as string[];
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr.includes('meetflow_access_token')).toBe(true);
      expect(cookieStr.includes('meetflow_refresh_token')).toBe(true);
    });

    it('returns 409 Conflict when email is already registered', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u-exists' } as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@skynet.ai',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('returns 400 Validation Error when input data is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'S',
          email: 'invalid-email',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('successfully logs in with valid credentials and sets cookies', async () => {
      const hashedPassword = await hashPassword('Password123!');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u-123',
        name: 'Sarah Connor',
        email: 'sarah@skynet.ai',
        passwordHash: hashedPassword,
        avatarUrl: null,
        role: 'MEMBER',
        workspaceMembers: [
          {
            role: 'OWNER',
            workspace: {
              id: 'ws-123',
              name: 'Cyberdyne Systems',
              slug: 'cyberdyne-systems',
            },
          },
        ],
        onboarding: {
          completedAt: new Date(),
          currentStep: 5,
        },
      } as any);
      vi.mocked(prisma.authSession.create).mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sarah@skynet.ai',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Sarah Connor');
      expect(res.body.data.workspace.name).toBe('Cyberdyne Systems');
      expect(res.body.data.onboarding.completed).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 when password does not match', async () => {
      const hashedPassword = await hashPassword('DifferentPassword123!');
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u-123',
        email: 'sarah@skynet.ai',
        passwordHash: hashedPassword,
        workspaceMembers: [],
      } as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sarah@skynet.ai',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 200 with current user profile when valid access token is present', async () => {
      const token = generateAccessToken({ userId: 'u-123', email: 'sarah@skynet.ai' });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u-123',
        name: 'Sarah Connor',
        email: 'sarah@skynet.ai',
        avatarUrl: null,
        role: 'MEMBER',
        createdAt: new Date(),
        workspaceMembers: [
          {
            role: 'OWNER',
            workspace: {
              id: 'ws-123',
              name: 'Resistance HQ',
              slug: 'resistance-hq',
              organizationName: 'Tech Resistance',
            },
          },
        ],
        onboarding: {
          completedAt: new Date(),
          currentStep: 5,
          professionalRole: 'Leadership',
          primaryUseCases: ['Meeting notes'],
        },
      } as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`meetflow_access_token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('sarah@skynet.ai');
      expect(res.body.data.workspace.name).toBe('Resistance HQ');
      expect(res.body.data.onboarding.professionalRole).toBe('Leadership');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes session and clears cookies', async () => {
      vi.mocked(prisma.authSession.updateMany).mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', ['meetflow_refresh_token=sample-refresh-token']);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = (res.headers['set-cookie'] || []) as string[];
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : String(cookies);
      expect(cookieStr.includes('meetflow_access_token=;')).toBe(true);
    });
  });
});
