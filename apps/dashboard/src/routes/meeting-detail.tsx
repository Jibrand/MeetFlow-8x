import { PageSkeleton } from '../components/page-skeleton';
import { createRoute, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './root';
import { MeetingDetailScaffold } from '../features/meeting-detail/meeting-detail-scaffold';
import { apiFetchMeeting } from '../features/meetings/meetings-api';
import { ApiError } from '../lib/api-client';
import { EmptyState, Button } from '@meetflow/ui';
import { AlertTriangle } from 'lucide-react';
import { meetingKey } from '../features/meetings/use-meetings';

export const meetingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meetings/$meetingId',
  component: MeetingDetailPage,
});

export function MeetingDetailPage() {
  const { meetingId } = useParams({ from: '/meetings/$meetingId' });
  const query = useQuery({
    gcTime: 300_000,
    staleTime: 30_000,
    queryKey: meetingKey(meetingId),
    queryFn: ({ signal }) => apiFetchMeeting(meetingId, signal),
    retry: false,
  });
  if (query.isPending)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PageSkeleton kind="detail" />
      </div>
    );
  if (!query.data) {
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
    <>
      {query.error && (
        <div
          role="alert"
          className="mx-auto max-w-7xl px-6 pt-4 text-xs text-destructive"
        >
          Could not refresh meeting. {query.error.message}{' '}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
          >
            Try Again
          </Button>
        </div>
      )}
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
    </>
  );
}
