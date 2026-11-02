import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from './logger';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe('Development diagnostics', () => {
  it('supports both log signatures and emits concise text without JSON, timestamps or request IDs', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Meeting queued', { meetingId: 'meeting-1' });
    logger.info({ message: 'API ready', requestId: 'request-1', port: 4000 });
    expect(log.mock.calls).toEqual([
      ['[status] Meeting queued — meetingId: meeting-1'],
      ['[status] API ready — port: 4000'],
    ]);
  });
  it('retains failure diagnostics while redacting credentials', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('OPENAI_API_KEY', 'test-secret-do-not-log');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Worker failed', {
      error: new Error(
        'Could not use test-secret-do-not-log with redis://user:password@host:6379',
      ),
    });
    const output = log.mock.calls.flat().join('\n');
    expect(output).toContain('Worker failed');
    expect(output).toContain('Error: Could not use');
    expect(output).not.toContain('test-secret-do-not-log');
    expect(output).not.toContain('password@host');
  });
});
