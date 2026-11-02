import type { ReactNode } from 'react';
import { createRoute, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Skeleton } from '@meetflow/ui';
import { rootRoute } from './root';
import { API_BASE_URL } from '../lib/api-client';
interface PublicMeeting {
  title: string;
  startAt: string;
  summary?: {
    overview: string;
    keyPoints: string[];
    decisions: string[];
  } | null;
  highlights?: {
    note: string | null;
    quote: string;
    startTime: number | null;
  }[];
  actionItems?: {
    title: string;
    description: string | null;
    status: string;
    assigneeName: string | null;
    dueDate: string | null;
  }[];
  segments?: {
    text: string;
    startMs: number | null;
    speakerName: string | null;
  }[];
}
export const publicMeetingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share/$token',
  component: PublicMeetingPage,
});
export function PublicMeetingPage() {
  const { token } = useParams({ from: '/share/$token' });
  const query = useQuery({
    queryKey: ['public-meeting', token],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `${API_BASE_URL}/public/meetings/${encodeURIComponent(token)}`,
        { credentials: 'omit', cache: 'no-store', signal },
      ).catch(() => {
        throw new Error('We couldn’t connect. Please try again.');
      });
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? 'This share link is unavailable, expired, or has been revoked.'
            : 'We couldn’t load this meeting. Please try again.',
        );
      return (await response.json()).data as PublicMeeting;
    },
    retry: false,
    gcTime: 0,
    refetchInterval: (query) => (query.state.error ? false : 30_000),
  });
  const meeting = query.data;
  const section = (title: string, children: ReactNode) => (
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-7 shadow-xs">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <span className="font-semibold tracking-tight text-primary">
            MeetFlow
          </span>
          <span className="text-xs text-muted-foreground">
            Shared meeting · Read only
          </span>
        </div>
        {query.isPending ? (
          <div
            role="status"
            aria-label="Loading shared meeting"
            className="space-y-4"
          >
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-60" />
          </div>
        ) : query.isError || !meeting ? (
          <div role="alert" className="rounded-xl border p-6 space-y-3">
            <h1 className="text-lg font-semibold">Meeting unavailable</h1>
            <p className="text-sm text-muted-foreground">
              {query.error?.message}
            </p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <header className="py-3 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight break-words">
                {meeting.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date(meeting.startAt).toLocaleString()}
              </p>
            </header>
            {meeting.summary &&
              section(
                'AI summary',
                <div className="space-y-4 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">
                    {meeting.summary.overview}
                  </p>
                  {meeting.summary.keyPoints.length > 0 && (
                    <ul className="list-disc space-y-2 pl-5">
                      {meeting.summary.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  )}
                  {meeting.summary.decisions.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Decisions</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {meeting.summary.decisions.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>,
              )}
            {meeting.highlights &&
              section(
                'Highlights',
                <div className="space-y-4">
                  {meeting.highlights.length ? (
                    meeting.highlights.map((h, i) => (
                      <article
                        key={i}
                        className="rounded-lg bg-muted/40 p-4 space-y-2"
                      >
                        <h3 className="text-sm font-medium">
                          {h.note || 'Highlight'}
                        </h3>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {h.quote}
                        </p>
                        {h.startTime !== null && (
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(h.startTime / 60)}:
                            {String(Math.floor(h.startTime % 60)).padStart(
                              2,
                              '0',
                            )}
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No highlights saved.
                    </p>
                  )}
                </div>,
              )}
            {meeting.actionItems &&
              section(
                'Action items',
                <ul className="space-y-3">
                  {meeting.actionItems.length ? (
                    meeting.actionItems.map((item, i) => (
                      <li key={i} className="rounded-lg border p-4">
                        <p className="text-sm font-medium">
                          {item.status === 'DONE' ? '✓ ' : '○ '}
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        {(item.assigneeName || item.dueDate) && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {item.assigneeName}
                            {item.dueDate
                              ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}`
                              : ''}
                          </p>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">
                      No action items.
                    </li>
                  )}
                </ul>,
              )}
            {meeting.segments &&
              section(
                'Transcript',
                <div className="space-y-5 text-sm">
                  {meeting.segments.map((turn, i) => (
                    <article key={i}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {turn.speakerName || 'Speaker'}
                        {turn.startMs !== null
                          ? ` · ${Math.floor(turn.startMs / 60000)}:${String(Math.floor(turn.startMs / 1000) % 60).padStart(2, '0')}`
                          : ''}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {turn.text}
                      </p>
                    </article>
                  ))}
                </div>,
              )}
          </>
        )}
      </div>
    </main>
  );
}
