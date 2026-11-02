import { createRoute, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './root';
import { MeetingDetailScaffold } from '../features/meeting-detail/meeting-detail-scaffold';
import { apiFetchMeeting } from '../features/meetings/meetings-api';
import { ApiError } from '../lib/api-client';
import { EmptyState, Button } from '@meetflow/ui';
import { AlertTriangle } from 'lucide-react';

export const meetingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meetings/$meetingId',
  component: MeetingDetailPage,
});

export function MeetingDetailPage() {
  const { meetingId } = useParams({ from: '/meetings/$meetingId' });
  const query = useQuery({
    gcTime: 0,
    staleTime: 0,
    queryKey: ['meeting', meetingId],
    queryFn: () => apiFetchMeeting(meetingId),
    retry: false,
  });
  if (query.isPending) {
    return (
      <div
        role="status"
        aria-label="Loading meeting details"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6"
      >
        <div className="h-8 w-48 animate-pulse rounded bg-muted/40" />
        <div className="h-32 w-full animate-pulse rounded-lg border border-border/60 bg-muted/20" />
        <div className="h-64 w-full animate-pulse rounded-lg border border-border/60 bg-muted/20" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    const notFound =
      query.error instanceof ApiError && query.error.status === 404;
    return (
      <div role="alert" className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
          title={notFound ? 'Meeting Not Found' : 'Unable to load meeting'}
          description={
            query.error?.message || 'Meeting details are unavailable.'
          }
          actionLabel="Back to Meetings"
          onAction={() => (window.location.href = '/')}
        />
        {!notFound && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void query.refetch();
            }}
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }
  const { meeting, raw } = query.data;
  return (
    <MeetingDetailScaffold
      key={meeting.id}
      meeting={meeting}
      meetingId={meetingId}
      rawFilename={raw.transcripts?.[0]?.sourceFilename}
      sourceFormat={raw.transcripts?.[0]?.sourceFormat}
      onReload={() => {
        void query.refetch();
      }}
    />
  );
}
