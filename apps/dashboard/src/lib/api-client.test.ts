import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiClient,
  ApiError,
  backendConnectionMessage,
  processingFailureMessage,
  resetSessionInvalidState,
  setSessionHint,
  hasSessionHint,
} from './api-client';

afterEach(() => vi.unstubAllGlobals());
describe('Safe public error messages', () => {
  it('retains the session hint when token refresh fails because the network is unavailable', async () => {
    resetSessionInvalidState();
    setSessionHint(true);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ status: 401 })
        .mockRejectedValueOnce(new TypeError('Network unavailable')),
    );
    await expect(apiClient('/meetings')).rejects.toMatchObject({
      status: 0,
      message: backendConnectionMessage,
    });
    expect(hasSessionHint()).toBe(true);
    setSessionHint(false);
  });
  it('does not expose private addresses or stacks from server errors', () => {
    const failure = new ApiError(500, {
      code: 'P2028',
      message: 'Prisma transaction at http://localhost:4000/private.ts:239',
    });
    expect(failure.message).toBe('Something went wrong. Please try again.');
    expect(
      processingFailureMessage('REDIS_UNAVAILABLE: redis://private:6379'),
    ).not.toMatch(/redis|6379|private/i);
  });
  it('converts a network failure into the safe connection message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(new TypeError('fetch failed: http://private:4000')),
    );
    await expect(apiClient('/meetings')).rejects.toMatchObject({
      status: 0,
      message: backendConnectionMessage,
    });
  });
});
