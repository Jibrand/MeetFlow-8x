import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authAdapter } from './lib/auth-adapter';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema } from './schemas/auth-schemas';
import * as apiModule from '../../lib/api-client';

vi.mock('../../lib/api-client', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    status: number;
    constructor(status: number, error: { code: string; message: string }) {
      super(error.message);
      this.status = status;
      this.code = error.code;
    }
  },
}));

describe('AuthAdapter with Real API Integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('allows logging out and clears user state', async () => {
    vi.mocked(apiModule.apiClient).mockResolvedValue({ message: 'Logged out' });
    await authAdapter.logout();
    expect(authAdapter.getCurrentUser()).toBeNull();
    expect(authAdapter.isAuthenticated()).toBe(false);
  });

  it('allows logging in with valid credentials via API and updates session', async () => {
    vi.mocked(apiModule.apiClient).mockResolvedValue({
      user: {
        id: 'u-1',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        avatarUrl: null,
        role: 'MEMBER',
      },
      workspace: {
        id: 'ws-1',
        name: "Alex's Workspace",
        slug: 'alexs-workspace',
        role: 'OWNER',
      },
      onboarding: {
        completed: true,
        currentStep: 5,
      },
    });

    const result = await authAdapter.login('alex@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('alex@example.com');
    expect(result.user?.name).toBe('Alex Rivera');
    expect(authAdapter.isAuthenticated()).toBe(true);
    expect(authAdapter.getCurrentUser()?.workspace).toBe("Alex's Workspace");
  });

  it('supports registering a new user via API and establishes authenticated session', async () => {
    vi.mocked(apiModule.apiClient).mockResolvedValue({
      user: {
        id: 'u-2',
        name: 'Sarah Connor',
        email: 'sarah@skynet.ai',
        avatarUrl: null,
        role: 'MEMBER',
      },
      workspace: {
        id: 'ws-2',
        name: "Sarah's Workspace",
        slug: 'sarahs-workspace',
        role: 'OWNER',
      },
      onboarding: {
        completed: false,
        currentStep: 1,
      },
    });

    const result = await authAdapter.register('Sarah Connor', 'sarah@skynet.ai', 'Secret123!');
    expect(result.success).toBe(true);
    expect(result.user?.name).toBe('Sarah Connor');
    expect(result.user?.email).toBe('sarah@skynet.ai');
    expect(authAdapter.getCurrentUser()?.name).toBe('Sarah Connor');
  });

  it('handles server validation or credential failure gracefully', async () => {
    vi.mocked(apiModule.apiClient).mockRejectedValue(
      new apiModule.ApiError(401, { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' })
    );

    const result = await authAdapter.login('wrong@example.com', 'badpassword');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password.');
  });
});

describe('Auth Schemas Validation', () => {
  it('validates correct login credentials', () => {
    const valid = LoginSchema.safeParse({
      email: 'user@meetflow.ai',
      password: 'password123',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid email formats', () => {
    const invalid = LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects passwords shorter than 8 characters during registration', () => {
    const invalid = RegisterSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects mismatched password and confirmation', () => {
    const invalid = RegisterSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password456',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates forgot password email input', () => {
    const valid = ForgotPasswordSchema.safeParse({ email: 'valid@company.com' });
    expect(valid.success).toBe(true);

    const invalid = ForgotPasswordSchema.safeParse({ email: '' });
    expect(invalid.success).toBe(false);
  });
});
