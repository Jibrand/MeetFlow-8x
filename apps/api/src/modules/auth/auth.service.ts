import { prisma } from '../../lib/prisma';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateOpaqueToken,
  hashToken,
} from '../../lib/security';
import { RegisterInput, LoginInput, ResetPasswordInput } from './auth.schema';
import { config } from '../../config';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
  onboarding: {
    completed: boolean;
    currentStep: number;
    professionalRole?: string | null;
    primaryUseCases?: string[];
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      const err = new Error('An account with this email address already exists.');
      // @ts-expect-error custom error code
      err.code = 'EMAIL_ALREADY_EXISTS';
      // @ts-expect-error status
      err.status = 409;
      throw err;
    }

    const passwordHash = await hashPassword(input.password);
    const workspaceName = input.workspaceName || `${input.name}'s Workspace`;
    const slugBase = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${slugBase || 'workspace'}-${Date.now().toString(36)}`;

    // Create user, workspace, membership, and onboarding transactionally
    const { user, workspace, member, onboarding } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
        },
      });

      const newWorkspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
        },
      });

      const newMember = await tx.workspaceMember.create({
        data: {
          userId: newUser.id,
          workspaceId: newWorkspace.id,
          role: 'OWNER',
        },
      });

      const newOnboarding = await tx.userOnboarding.create({
        data: {
          userId: newUser.id,
          currentStep: 1,
        },
      });

      return {
        user: newUser,
        workspace: newWorkspace,
        member: newMember,
        onboarding: newOnboarding,
      };
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const { token: refreshToken, hash: refreshTokenHash } = generateOpaqueToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpiresDays);

    await prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: member.role,
      },
      onboarding: {
        completed: !!onboarding.completedAt,
        currentStep: onboarding.currentStep,
        professionalRole: onboarding.professionalRole,
        primaryUseCases: onboarding.primaryUseCases,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        workspaceMembers: {
          include: { workspace: true },
          take: 1,
        },
        onboarding: true,
      },
    });

    if (!user || !user.passwordHash) {
      const err = new Error('Invalid email or password.');
      // @ts-expect-error custom error code
      err.code = 'INVALID_CREDENTIALS';
      // @ts-expect-error status
      err.status = 401;
      throw err;
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      const err = new Error('Invalid email or password.');
      // @ts-expect-error custom error code
      err.code = 'INVALID_CREDENTIALS';
      // @ts-expect-error status
      err.status = 401;
      throw err;
    }

    // Determine primary workspace
    let activeWorkspace = user.workspaceMembers[0]?.workspace;
    let memberRole = user.workspaceMembers[0]?.role || 'OWNER';

    if (!activeWorkspace) {
      // Auto-create workspace if user has none
      const slug = `ws-${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
      activeWorkspace = await prisma.workspace.create({
        data: {
          name: `${user.name}'s Workspace`,
          slug,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });
      memberRole = 'OWNER';
    }

    // Generate tokens & session
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const { token: refreshToken, hash: refreshTokenHash } = generateOpaqueToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpiresDays);

    await prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      workspace: {
        id: activeWorkspace.id,
        name: activeWorkspace.name,
        slug: activeWorkspace.slug,
        role: memberRole,
      },
      onboarding: {
        completed: !!user.onboarding?.completedAt,
        currentStep: user.onboarding?.currentStep || 1,
        professionalRole: user.onboarding?.professionalRole,
        primaryUseCases: user.onboarding?.primaryUseCases || [],
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenHash = hashToken(rawRefreshToken);

    const session = await prisma.authSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      const err = new Error('Invalid or expired refresh token. Please sign in again.');
      // @ts-expect-error code
      err.code = 'INVALID_REFRESH_TOKEN';
      // @ts-expect-error status
      err.status = 401;
      throw err;
    }

    // Token rotation: Revoke old session
    await prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Create new session
    const newAccessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
    });
    const { token: newRefreshToken, hash: newRefreshTokenHash } = generateOpaqueToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwt.refreshTokenExpiresDays);

    await prisma.authSession.create({
      data: {
        userId: session.user.id,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const refreshTokenHash = hashToken(rawRefreshToken);
      await prisma.authSession.updateMany({
        where: { refreshTokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspaceMembers: {
          include: { workspace: true },
          take: 1,
        },
        onboarding: true,
      },
    });

    if (!user) {
      const err = new Error('User not found.');
      // @ts-expect-error code
      err.code = 'USER_NOT_FOUND';
      // @ts-expect-error status
      err.status = 404;
      throw err;
    }

    const member = user.workspaceMembers[0];
    const workspace = member?.workspace || {
      id: 'default',
      name: `${user.name}'s Workspace`,
      slug: 'default-workspace',
      organizationName: null,
    };

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        organizationName: workspace.organizationName,
        role: member?.role || 'OWNER',
      },
      onboarding: {
        completed: !!user.onboarding?.completedAt,
        currentStep: user.onboarding?.currentStep || 1,
        professionalRole: user.onboarding?.professionalRole,
        primaryUseCases: user.onboarding?.primaryUseCases || [],
      },
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return cleanly to prevent email enumeration
      return;
    }

    const { token: _token, hash: tokenHash } = generateOpaqueToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // In production without configured email credentials, report in server logs safely without token exposure
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      const err = new Error('Password reset token is invalid or has expired.');
      // @ts-expect-error code
      err.code = 'INVALID_RESET_TOKEN';
      // @ts-expect-error status
      err.status = 400;
      throw err;
    }

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Revoke all existing sessions for this user
      await tx.authSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}

export const authService = new AuthService();
