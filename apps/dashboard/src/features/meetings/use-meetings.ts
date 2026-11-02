import { useQuery, type QueryClient } from '@tanstack/react-query';
import { authAdapter } from '../auth/lib/auth-adapter';
import { apiFetchMeetings } from './meetings-api';

export function workspaceScope(): string {
  const user = authAdapter.getUser();
  return `${user?.id ?? 'anonymous'}:${user?.workspaceId ?? 'none'}`;
}
export const meetingKey = (id: string) => ['meeting', workspaceScope(), id] as const;
export function useMeetingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['meetings', workspaceScope()], queryFn: () => apiFetchMeetings(), enabled,
    staleTime: 30_000, gcTime: 300_000, retry: false, refetchOnWindowFocus: false,
    refetchInterval: (query) => query.state.data?.meetings.some((meeting) => meeting.status === 'processing') ? 3000 : false,
  });
}
export async function invalidateMeetingData(client: QueryClient): Promise<void> {
  await Promise.all(['meetings', 'meeting', 'overview', 'action-items'].map((key) => client.invalidateQueries({ queryKey: [key] })));
}
