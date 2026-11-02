import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateOpaqueToken,
  hashToken,
} from '../../lib/security';
import type { RegisterInput, LoginInput } from './auth.schema';
import { config } from '../../config';

const authError = (status: number, code: string, message: string) =>
  Object.assign(new Error(message), { status, code });
const invalidCredentials = () =>
  authError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
const registrationClosed = () =>
  authError(
    403,
    'REGISTRATION_CLOSED',
    'The admin account is already configured. Please sign in.',
  );
const sessionExpiry = () =>
  new Date(Date.now() + config.jwt.refreshTokenExpiresDays * 86400000);

export class AuthService {
  async registrationStatus() {
    const state = await prisma.instanceState.findUnique({
      where: { id: 'primary' },
    });
    if (!state) return { registrationOpen: (await prisma.user.count()) === 0 };
    const admin = await prisma.user.findUnique({
      where: { id: state.userId },
      select: { passwordHash: true },
    });
    // Migration-created disabled placeholders are not registered accounts.
    return { registrationOpen: admin?.passwordHash === '!disabled' };
  }

  private async newSession(
    tx: Prisma.TransactionClient,
    user: { id: string; email: string },
  ) {
    const id = randomUUID();
    const { token, hash } = generateOpaqueToken();
    await tx.authSession.create({
      data: {
        id,
        userId: user.id,
        refreshTokenHash: hash,
        expiresAt: sessionExpiry(),
      },
    });
    return {
      accessToken: generateAccessToken({
        userId: user.id,
        email: user.email,
        sessionId: id,
      }),
      refreshToken: token,
    };
  }

  async register(input: RegisterInput) {
    if (!(await this.registrationStatus()).registrationOpen)
      throw registrationClosed();
    const passwordHash = await hashPassword(input.password);
    const result = await prisma.$transaction(
      async (tx) => {
        // A transaction-scoped PostgreSQL lock serializes first-admin registration.
        // No second request can create or claim another administrator.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(826104921)::text AS locked`;
        const state = await tx.instanceState.findUnique({
          where: { id: 'primary' },
        });
        let user;
        let workspace;
        if (state) {
          const admin = await tx.user.findUniqueOrThrow({
            where: { id: state.userId },
          });
          if (admin.passwordHash !== '!disabled') throw registrationClosed();
          user = await tx.user.update({
            where: { id: admin.id },
            data: {
              name: input.name,
              email: input.email,
              passwordHash,
              role: 'ADMIN',
            },
          });
          workspace = await tx.workspace.update({
            where: { id: state.workspaceId },
            data: input.workspaceName ? { name: input.workspaceName } : {},
          });
          await tx.authSession.updateMany({
            where: { userId: admin.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        } else {
          if ((await tx.user.count()) > 0) throw registrationClosed();
          user = await tx.user.create({
            data: {
              name: input.name,
              email: input.email,
              passwordHash,
              role: 'ADMIN',
            },
          });
          workspace = await tx.workspace.create({
            data: {
              name: input.workspaceName || `${input.name}'s Workspace`,
              slug: `meetflow-${randomUUID()}`,
            },
          });
          await tx.instanceState.create({
            data: { id: 'primary', userId: user.id, workspaceId: workspace.id },
          });
        }
        await tx.workspaceMember.upsert({
          where: {
            userId_workspaceId: { userId: user.id, workspaceId: workspace.id },
          },
          create: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
          update: { role: 'OWNER' },
        });
        await tx.userOnboarding.upsert({
          where: { userId: user.id },
          create: { userId: user.id, completedAt: new Date(), currentStep: 1 },
          update: { completedAt: new Date() },
        });
        const tokens = await this.newSession(tx, user);
        return { userId: user.id, ...tokens };
      },
      { maxWait: 5000, timeout: 15000 },
    );
    return {
      ...(await this.getCurrentUser(result.userId)),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  async login(input: LoginInput) {
    const state = await prisma.instanceState.findUnique({
      where: { id: 'primary' },
    });
    const user = state
      ? await prisma.user.findUnique({ where: { id: state.userId } })
      : null;
    // Always do password work so an incorrect email is not a cheap timing oracle.
    const valid = await verifyPassword(
      input.password,
      user?.passwordHash?.startsWith('$2')
        ? user.passwordHash
        : '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxFDr0mqZbP2Sl2c5hIz0yQx.Ku',
    );
    if (
      !user ||
      user.email.toLowerCase() !== input.email ||
      !valid ||
      user.passwordHash === '!disabled'
    )
      throw invalidCredentials();
    const tokens = await prisma.$transaction((tx) => this.newSession(tx, user));
    return { ...(await this.getCurrentUser(user.id)), ...tokens };
  }

  async refresh(rawRefreshToken: string) {
    const refreshTokenHash = hashToken(rawRefreshToken);
    const { token, hash } = generateOpaqueToken();
    return prisma.$transaction(async (tx) => {
      const session = await tx.authSession.findUnique({
        where: { refreshTokenHash },
        include: { user: true },
      });
      const state = await tx.instanceState.findUnique({
        where: { id: 'primary' },
      });
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        state?.userId !== session.userId
      ) {
        throw authError(
          401,
          'INVALID_REFRESH_TOKEN',
          'Your session has expired. Please sign in again.',
        );
      }
      // Compare-and-swap prevents replay and concurrent rotation of one token.
      // Keep the session ID stable so logout invalidates every token from this session.
      const claimed = await tx.authSession.updateMany({
        where: {
          id: session.id,
          refreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { refreshTokenHash: hash, lastUsedAt: new Date() },
      });
      if (!claimed.count)
        throw authError(
          401,
          'INVALID_REFRESH_TOKEN',
          'Your session has expired. Please sign in again.',
        );
      return {
        accessToken: generateAccessToken({
          userId: session.userId,
          email: session.user.email,
          sessionId: session.id,
        }),
        refreshToken: token,
      };
    });
  }

  async logout(rawRefreshToken?: string, sessionId?: string) {
    if (!rawRefreshToken && !sessionId) return;
    await prisma.authSession.updateMany({
      where: {
        revokedAt: null,
        OR: [
          ...(rawRefreshToken
            ? [{ refreshTokenHash: hashToken(rawRefreshToken) }]
            : []),
          ...(sessionId ? [{ id: sessionId }] : []),
        ],
      },
      data: { revokedAt: new Date() },
    });
  }

  async getCurrentUser(userId: string) {
    const state = await prisma.instanceState.findUnique({
      where: { id: 'primary' },
    });
    if (state?.userId !== userId)
      throw authError(
        401,
        'UNAUTHORIZED',
        'Please sign in as the workspace admin.',
      );
    const [user, workspace] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      prisma.workspace.findUniqueOrThrow({ where: { id: state.workspaceId } }),
    ]);
    return {
      user: { ...user, role: 'ADMIN' },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        organizationName: workspace.organizationName,
        role: 'OWNER',
      },
      onboarding: { completed: true, currentStep: 1 },
    };
  }
}
export const authService = new AuthService();
