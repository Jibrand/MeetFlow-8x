import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MeetingsPage } from './index';
import { MeetingDetailPage } from './meeting-detail';
import { CalendarView } from '../features/calendar/calendar-view';
import {
  apiFetchMeeting,
  apiFetchMeetings,
} from '../features/meetings/meetings-api';
import { ApiError } from '../lib/api-client';
import type { MeetingItem } from '../types/meeting';

const route = vi.hoisted(() => ({ id: 'real-meeting' }));
vi.mock('../features/auth/lib/auth-adapter', () => ({
  authAdapter: { getUser: () => ({ id: 'test', workspaceId: 'workspace' }) },
}));
vi.mock('./root', () => ({ rootRoute: {} }));
vi.mock('@tanstack/react-router', () => ({
  createRoute: (options: unknown) => options,
  useParams: () => ({ meetingId: route.id }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock('../features/meetings/meetings-api', () => ({
  apiFetchMeetings: vi.fn(),
  apiFetchMeeting: vi.fn(),
}));
vi.mock('../features/meetings/add-meeting-dialog', () => ({
  AddMeetingDialog: () => <button>Add Meeting</button>,
}));
vi.mock('../features/meeting-detail/meeting-detail-scaffold', () => ({
  MeetingDetailScaffold: ({ meeting }: { meeting: MeetingItem }) => (
    <h2>{meeting.title}</h2>
  ),
}));

const realMeeting: MeetingItem = {
  id: 'real-meeting',
  title: 'Only Neon meeting',
  startDate: new Date().toISOString(),
  durationSeconds: 0,
  status: 'ready',
  platform: 'upload',
  organizer: { id: '', name: '', email: '' },
  participants: [],
  previewSummary: '',
  tags: [],
  actionItemCount: 0,
  highlightCount: 0,
  hasRecording: false,
  hasTranscript: true,
};
function mount(component: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrap = (view: React.ReactElement) => (
    <QueryClientProvider client={client}>{view}</QueryClientProvider>
  );
  return { ...render(wrap(component)), wrap };
}
beforeEach(() => {
  vi.resetAllMocks();
  route.id = 'real-meeting';
});
afterEach(cleanup);

describe('Backend-only page loading', () => {
  it.each([
    ['Calendar', CalendarView, 'Loading calendar'],
    ['Meetings', MeetingsPage, 'Loading meetings'],
    ['Meeting Detail', MeetingDetailPage, 'Loading meeting details'],
  ] as const)(
    '%s shows a skeleton throughout a delayed response, then only backend data',
    async (_name, Component, label) => {
      let resolveList!: (
        data: Awaited<ReturnType<typeof apiFetchMeetings>>,
      ) => void;
      let resolveDetail!: (
        data: Awaited<ReturnType<typeof apiFetchMeeting>>,
      ) => void;
      vi.mocked(apiFetchMeetings).mockReturnValue(
        new Promise((resolve) => {
          resolveList = resolve;
        }),
      );
      vi.mocked(apiFetchMeeting).mockReturnValue(
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
      );
      mount(<Component />);
      expect(screen.getByRole('status', { name: label })).toBeDefined();
      expect(screen.queryByText('Only Neon meeting')).toBeNull();
      expect(
        screen.queryByText(
          /Sarah Connor|Q4 Product Roadmap|Design Sprint|Verified Audio/i,
        ),
      ).toBeNull();
      if (resolveList) resolveList({ meetings: [realMeeting], total: 1 });
      if (resolveDetail)
        resolveDetail({
          meeting: realMeeting,
          raw: { transcripts: [] },
        } as unknown as Awaited<ReturnType<typeof apiFetchMeeting>>);
      await waitFor(() =>
        expect(screen.queryByRole('status', { name: label })).toBeNull(),
      );
      expect(screen.getAllByText('Only Neon meeting').length).toBeGreaterThan(
        0,
      );
    },
  );

  it.each([CalendarView, MeetingsPage])(
    'renders an empty workspace without seeded fallback',
    async (Component) => {
      vi.mocked(apiFetchMeetings).mockResolvedValue({ meetings: [], total: 0 });
      mount(<Component />);
      await waitFor(() =>
        expect(
          screen.getByText(/No meetings (?:in (this )?workspace|scheduled)/i),
        ).toBeDefined(),
      );
      expect(screen.queryByText(/Sarah Connor|Q4 Product Roadmap/i)).toBeNull();
    },
  );

  it.each([CalendarView, MeetingsPage, MeetingDetailPage])(
    'shows errors and supports retry instead of falling back to demo data',
    async (Component) => {
      vi.mocked(apiFetchMeetings)
        .mockRejectedValueOnce(new Error('Backend offline'))
        .mockResolvedValue({ meetings: [], total: 0 });
      vi.mocked(apiFetchMeeting)
        .mockRejectedValueOnce(new Error('Backend offline'))
        .mockResolvedValue({ meeting: realMeeting, raw: {} } as Awaited<
          ReturnType<typeof apiFetchMeeting>
        >);
      mount(<Component />);
      await screen.findByText('Backend offline');
      expect(screen.queryByText(/Sarah Connor|Q4 Product Roadmap/i)).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      await waitFor(() =>
        expect(screen.queryByText('Backend offline')).toBeNull(),
      );
    },
  );

  it('retains all calendar dates and month navigation with zero meetings, including agenda selection', async () => {
    vi.mocked(apiFetchMeetings).mockResolvedValue({ meetings: [], total: 0 });
    mount(<CalendarView />);
    await screen.findByText('No meetings scheduled');
    const now = new Date();
    const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    expect(screen.getAllByRole('button', { name: /Create meeting on/ })).toHaveLength(count);
    expect(screen.getByText(now.toLocaleString('default', { month: 'long', year: 'numeric' }))).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    expect(screen.getByText(next.toLocaleString('default', { month: 'long', year: 'numeric' }))).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));
    expect(screen.getAllByRole('button', { name: /Create meeting on/ }).length).toBeGreaterThan(27);
    expect(screen.queryByText(/Only Neon meeting/)).toBeNull();
  });

  it('clears the old meeting on route change while the next meeting loads', async () => {
    vi.mocked(apiFetchMeeting).mockResolvedValueOnce({
      meeting: realMeeting,
      raw: {},
    } as Awaited<ReturnType<typeof apiFetchMeeting>>);
    const view = mount(<MeetingDetailPage />);
    await screen.findByText('Only Neon meeting');
    route.id = 'another-meeting';
    vi.mocked(apiFetchMeeting).mockReturnValue(new Promise(() => {}));
    view.rerender(view.wrap(<MeetingDetailPage />));
    expect(screen.queryByText('Only Neon meeting')).toBeNull();
    expect(
      screen.getByRole('status', { name: 'Loading meeting details' }),
    ).toBeDefined();
  });

  it('distinguishes a missing meeting from a connection error', async () => {
    vi.mocked(apiFetchMeeting).mockRejectedValue(
      new ApiError(404, {
        code: 'MEETING_NOT_FOUND',
        message: 'Meeting not found in this workspace.',
      }),
    );
    mount(<MeetingDetailPage />);
    await screen.findByText('Meeting Not Found');
    expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull();
  });
});
