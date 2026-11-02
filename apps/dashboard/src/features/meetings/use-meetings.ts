import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import * as React from 'react';
import { authAdapter } from '../auth/lib/auth-adapter';
import { apiFetchMeetings } from './meetings-api';

export function workspaceScope(): string {
  const user = authAdapter.getUser();
  return `${user?.id ?? 'anonymous'}:${user?.workspaceId ?? 'none'}`;
}
export const meetingKey = (id: string) =>
  ['meeting', workspaceScope(), id] as const;
export function useMeetingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['meetings', workspaceScope()],
    queryFn: ({ signal }) => apiFetchMeetings(undefined, signal),
    enabled,
    staleTime: 30_000,
    gcTime: 300_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data?.meetings.some(
        (meeting) => meeting.status === 'processing',
      )
        ? 3000
        : false,
  });
}
export function useWorkspaceProcessingSync() {
  const query = useMeetingsQuery();
  const client = useQueryClient();
  const previous = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (!query.data) return;
    const current = new Set(
      query.data.meetings
        .filter((meeting) => meeting.status === 'processing')
        .map((meeting) => meeting.id),
    );
    if (
      [...previous.current].some((id) => !current.has(id)) &&
      !client.isMutating({
        mutationKey: ['toggle-action-item', workspaceScope()],
      })
    ) {
      for (const key of ['action-items', 'overview', 'meeting'])
        void client.invalidateQueries({ queryKey: [key, workspaceScope()] });
    }
    previous.current = current;
  }, [query.data, client]);
}
export async function invalidateMeetingData(
  client: QueryClient,
): Promise<void> {
  await Promise.all(
    ['meetings', 'meeting', 'overview', 'action-items'].map((key) =>
      client.invalidateQueries({ queryKey: [key, workspaceScope()] }),
    ),
  );
}
