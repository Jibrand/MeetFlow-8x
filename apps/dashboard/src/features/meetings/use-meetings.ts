import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import * as React from 'react';
import { authAdapter } from '../auth/lib/auth-adapter';
import type { MeetingItem } from '../../types/meeting';
import type { MeetingFiltersState } from './meeting-filters';
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
  const query = useQuery({
    queryKey: ['processing-meetings', workspaceScope()],
    queryFn: ({ signal }) =>
      apiFetchMeetings(
        { viewStatus: 'processing', page: 1, limit: 100 },
        signal,
      ),
    staleTime: 15_000,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.meetings.length ? 15_000 : false,
    refetchOnWindowFocus: false,
  });
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
      for (const key of [
        'action-items',
        'overview',
        'meeting',
        'meetings',
        'meeting-pages',
        'summary-variant',
        'highlights',
      ])
        void client.invalidateQueries({ queryKey: [key, workspaceScope()] });
    }
    previous.current = current;
  }, [query.data, client]);
}
export async function invalidateMeetingData(
  client: QueryClient,
): Promise<void> {
  await Promise.all(
    [
      'meetings',
      'meeting-pages',
      'processing-meetings',
      'meeting',
      'overview',
      'action-items',
      'summary-variant',
      'highlights',
    ].map((key) =>
      client.invalidateQueries({ queryKey: [key, workspaceScope()] }),
    ),
  );
}

export function useMeetingPage(page: number, filters: MeetingFiltersState) {
  return useQuery({
    queryKey: [
      'meeting-pages',
      workspaceScope(),
      {
        page,
        search: filters.search,
        status: filters.status,
        platform: filters.platform,
        sort: filters.sort,
      },
    ],
    queryFn: ({ signal }) =>
      apiFetchMeetings(
        {
          page,
          limit: 9,
          search: filters.search || undefined,
          viewStatus: filters.status === 'all' ? undefined : filters.status,
          platform: filters.platform === 'all' ? undefined : filters.platform,
          sort: filters.sort,
        },
        signal,
      ),
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
export async function insertCreatedMeeting(
  client: QueryClient,
  meeting: MeetingItem,
) {
  await Promise.all(
    ['meeting-pages', 'meetings'].map((key) =>
      client.cancelQueries({ queryKey: [key, workspaceScope()] }),
    ),
  );
  const scope = workspaceScope();
  client.setQueriesData<{ meetings: MeetingItem[]; total: number }>(
    { queryKey: ['meetings', scope] },
    (old) =>
      old
        ? {
            meetings: [
              meeting,
              ...old.meetings.filter((item) => item.id !== meeting.id),
            ],
            total:
              old.total +
              (old.meetings.some((item) => item.id === meeting.id) ? 0 : 1),
          }
        : old,
  );
  // The default first page is a bounded server page; show acknowledged creates before refetch.
  const key = [
    'meeting-pages',
    scope,
    { page: 1, search: '', status: 'all', platform: 'all', sort: 'newest' },
  ];
  client.setQueryData<{ meetings: MeetingItem[]; total: number }>(
    key,
    (old) => ({
      meetings: [
        meeting,
        ...(old?.meetings ?? []).filter((item) => item.id !== meeting.id),
      ].slice(0, 9),
      total:
        (old?.total ?? 0) +
        (old?.meetings.some((item) => item.id === meeting.id) ? 0 : 1),
    }),
  );
}
