import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authAdapter } from './lib/auth-adapter';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema } from './schemas/auth-schemas';
import * as apiModule from '../../lib/api-client';

vi.mock('../../lib/api-client', () => ({
  apiClient: vi.fn(),
  setSessionHint: vi.fn(),
  resetSessionInvalidState: vi.fn(),
  markSessionInvalid: vi.fn(),
  hasSessionHint: vi.fn().mockReturnValue(false),
  performTokenRefresh: vi.fn().mockResolvedValue(false),
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

  it('allows logging out and clears user state upon API success', async () => {
    vi.mocked(apiModule.apiClient).mockResolvedValue({ message: 'Logged out' });
    await authAdapter.logout();
    expect(authAdapter.getCurrentUser()).toBeNull();
    expect(authAdapter.isAuthenticated()).toBe(false);
  });

  it('preserves user state and propagates error if logout API call fails', async () => {
    vi.mocked(apiModule.apiClient).mockResolvedValueOnce({
      user: { id: 'u-logout-test', name: 'Test User', email: 'logout@test.com', avatarUrl: null, role: 'MEMBER' },
      workspace: { id: 'ws-1', name: 'Test Workspace', slug: 'test', role: 'OWNER' },
      onboarding: { completed: true, currentStep: 5 },
    });
    await authAdapter.login('logout@test.com', 'password123');
    expect(authAdapter.isAuthenticated()).toBe(true);

    vi.mocked(apiModule.apiClient).mockRejectedValueOnce(
      new apiModule.ApiError(500, { code: 'SERVER_ERROR', message: 'Logout service unavailable' })
    );

    await expect(authAdapter.logout()).rejects.toThrow('Logout service unavailable');
    // Session state preserved on error
    expect(authAdapter.getCurrentUser()?.email).toBe('logout@test.com');
  });

  it('strictly requires server verification and does not trust arbitrary client storage', async () => {
    // Attempt to inject fake session in sessionStorage
    sessionStorage.setItem('meetflow-session-cache', JSON.stringify({ name: 'Hacker', role: 'ADMIN' }));
    // Server rejects session with 401
    vi.mocked(apiModule.apiClient).mockRejectedValue(
      new apiModule.ApiError(401, { code: 'UNAUTHORIZED', message: 'Session expired' })
    );

    const user = await authAdapter.syncSessionWithServer();
    expect(user).toBeNull();
    expect(authAdapter.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('meetflow-session-cache')).toBeNull();
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

  it('treats 401 from /auth/me as an expected unauthenticated state and keeps apiAvailable true', async () => {
    vi.mocked(apiModule.apiClient).mockRejectedValue(
      new apiModule.ApiError(401, { code: 'UNAUTHORIZED', message: 'Authentication required' })
    );

    const user = await authAdapter.syncSessionWithServer();
    expect(user).toBeNull();
    expect(authAdapter.isAuthenticated()).toBe(false);
    expect(authAdapter.isApiAvailable()).toBe(true);
    expect(authAdapter.getApiError()).toBeNull();
  });

  it('handles backend network unavailability separately and flags apiAvailable as false', async () => {
    vi.mocked(apiModule.apiClient).mockRejectedValue(
      new apiModule.ApiError(0, { code: 'API_UNAVAILABLE', message: 'Backend is offline.' })
    );

    const user = await authAdapter.syncSessionWithServer();
    expect(user).toBeNull();
    expect(authAdapter.isApiAvailable()).toBe(false);
    expect(authAdapter.getApiError()).toBeTruthy();
    expect(authAdapter.isInitialized()).toBe(true);
  });

  it('guarantees isInitialized becomes true after login so route guards do not spin infinitely', async () => {
    vi.mocked(apiModule.apiClient).mockResolvedValue({
      user: {
        id: 'u-3',
        name: 'Jordan Belfort',
        email: 'jordan@wallstreet.com',
        avatarUrl: null,
        role: 'OWNER',
      },
      workspace: {
        id: 'ws-3',
        name: "Stratton Oakmont",
        slug: 'stratton-oakmont',
        role: 'OWNER',
      },
      onboarding: {
        completed: true,
        currentStep: 5,
      },
    });

    const result = await authAdapter.login('jordan@wallstreet.com', 'password123');
    expect(result.success).toBe(true);
    expect(authAdapter.isInitialized()).toBe(true);
    expect(authAdapter.isAuthenticated()).toBe(true);
  });

  it('protects against race condition: stale 401 sync does not wipe out active login session', async () => {
    let rejectSync: (reason: any) => void = () => {};
    const deferredSync = new Promise((_, reject) => {
      rejectSync = reject;
    });

    // 1. Initial syncSessionWithServer starts
    vi.mocked(apiModule.apiClient).mockReturnValueOnce(deferredSync as any);
    const syncPromise = authAdapter.syncSessionWithServer();

    // 2. User successfully logs in before the slow sync finishes
    vi.mocked(apiModule.apiClient).mockResolvedValueOnce({
      user: {
        id: 'u-4',
        name: 'Elena Rostova',
        email: 'elena@example.com',
        avatarUrl: null,
        role: 'MEMBER',
      },
      workspace: {
        id: 'ws-4',
        name: "Elena's Workspace",
        slug: 'elenas-workspace',
        role: 'OWNER',
      },
      onboarding: {
        completed: true,
        currentStep: 5,
      },
    });
    const loginResult = await authAdapter.login('elena@example.com', 'secret123');
    expect(loginResult.success).toBe(true);
    expect(authAdapter.getCurrentUser()?.email).toBe('elena@example.com');

    // 3. Now the old sync resolves with 401
    rejectSync(new apiModule.ApiError(401, { code: 'UNAUTHORIZED', message: 'Token required' }));
    await syncPromise;

    // 4. Active user session MUST be preserved despite the stale 401
    expect(authAdapter.getCurrentUser()?.email).toBe('elena@example.com');
    expect(authAdapter.isAuthenticated()).toBe(true);
    expect(authAdapter.isInitialized()).toBe(true);
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
