import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { insertCreatedMeeting } from './use-meetings';
import type { MeetingItem } from '../../types/meeting';

vi.mock('../auth/lib/auth-adapter', () => ({
  authAdapter: { getUser: () => ({ id: 'user', workspaceId: 'workspace' }) },
}));

describe('Acknowledged meeting creation cache', () => {
  it('inserts immediately, bounds the first server page, and never duplicates a replayed create', async () => {
    const client = new QueryClient();
    const key = [
      'meeting-pages',
      'user:workspace',
      { page: 1, search: '', status: 'all', platform: 'all', sort: 'newest' },
    ];
    const meetings = Array.from(
      { length: 9 },
      (_, index) => ({ id: String(index) }) as MeetingItem,
    );
    client.setQueryData(key, { meetings, total: 20 });
    const created = { id: 'created' } as MeetingItem;
    await insertCreatedMeeting(client, created);
    await insertCreatedMeeting(client, created);
    const result = client.getQueryData<{
      meetings: MeetingItem[];
      total: number;
    }>(key)!;
    expect(result.meetings[0].id).toBe('created');
    expect(result.meetings).toHaveLength(9);
    expect(new Set(result.meetings.map((item) => item.id)).size).toBe(9);
    expect(result.total).toBe(21);
    client.clear();
  });
});
