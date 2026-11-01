import { describe, it, expect, beforeEach } from 'vitest';
import { authAdapter } from './lib/auth-adapter';
import { LoginSchema, RegisterSchema, ForgotPasswordSchema } from './schemas/auth-schemas';

describe('AuthAdapter', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts with a demo user session for evaluation mode', () => {
    const user = authAdapter.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe('jibran@meetflow.ai');
    expect(authAdapter.isAuthenticated()).toBe(true);
  });

  it('allows logging out and clears user state', () => {
    authAdapter.logout();
    expect(authAdapter.getCurrentUser()).toBeNull();
    expect(authAdapter.isAuthenticated()).toBe(false);
  });

  it('allows logging back in with valid credentials', async () => {
    authAdapter.logout();
    const result = await authAdapter.login('alex@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('alex@example.com');
    expect(authAdapter.isAuthenticated()).toBe(true);
  });

  it('supports registering a new user and signs them in', async () => {
    authAdapter.logout();
    const result = await authAdapter.register('Sarah Connor', 'sarah@skynet.ai', 'Secret123!');
    expect(result.success).toBe(true);
    expect(result.user?.name).toBe('Sarah Connor');
    expect(result.user?.email).toBe('sarah@skynet.ai');
    expect(authAdapter.getCurrentUser()?.name).toBe('Sarah Connor');
  });

  it('supports instant demo evaluator login', () => {
    authAdapter.logout();
    const user = authAdapter.loginAsDemo();
    expect(user.email).toBe('jibran@meetflow.ai');
    expect(authAdapter.isAuthenticated()).toBe(true);
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
