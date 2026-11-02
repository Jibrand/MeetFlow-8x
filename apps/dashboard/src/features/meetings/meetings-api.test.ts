import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiFetchMeetings,
  mapBackendMeetingToItem,
  type BackendMeeting,
} from './meetings-api';

afterEach(() => vi.unstubAllGlobals());
describe('Backend meeting mapping', () => {
  it('preserves empty real data instead of manufacturing duration, tags, or host credentials', () => {
    const mapped = mapBackendMeetingToItem({
      id: 'real',
      title: 'Meeting',
      processingStatus: 'NOT_STARTED',
      meetingStatus: 'COMPLETED',
      participants: [],
      sourceType: 'MANUAL',
      durationSeconds: 0,
    } as unknown as BackendMeeting);
    expect(mapped.durationSeconds).toBe(0);
    expect(mapped.organizer.email).toBe('');
    expect(mapped.tags).toEqual([]);
    expect(mapped.actionItems).toEqual([]);
    expect(mapped.highlights).toEqual([]);
    expect(mapped.status).not.toBe('ready');
  });

  it('loads all backend pages rather than silently dropping meetings after the first page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              meetings: [{ id: '1', participants: [] }],
              pagination: { total: 2, totalPages: 2 },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              meetings: [{ id: '2', participants: [] }],
              pagination: { total: 2, totalPages: 2 },
            },
          }),
        ),
      );
    vi.stubGlobal('fetch', fetch);
    const data = await apiFetchMeetings();
    expect(data.meetings.map((meeting) => meeting.id)).toEqual(['1', '2']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
