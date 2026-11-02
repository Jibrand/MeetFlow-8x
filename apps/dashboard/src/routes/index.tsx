import { PageSkeleton } from '../components/page-skeleton';
import { useMeetingsQuery } from '../features/meetings/use-meetings';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { MeetingList } from '../features/meetings/meeting-list';
import { AddMeetingDialog } from '../features/meetings/add-meeting-dialog';
import { EmptyState, Button } from '@meetflow/ui';
import { Video, RefreshCw, AlertCircle } from 'lucide-react';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MeetingsPage,
});

export function MeetingsPage() {
  const query = useMeetingsQuery();
  const meetings = query.data?.meetings ?? [];
  const loading = query.isPending;
  const error = query.error?.message;
  const loadMeetings = () => {
    void query.refetch();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            My Meetings
          </h1>
          <p className="text-xs text-muted-foreground">
            Search meeting transcripts, review AI summaries, and monitor
            automated action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMeetings}
            disabled={query.isFetching}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </Button>
          <AddMeetingDialog />
        </div>
      </div>

      {error && query.data && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 p-3 text-xs"
        >
          <span>Could not refresh meetings. {error}</span>
          <Button variant="outline" size="sm" onClick={loadMeetings}>
            Try Again
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && meetings.length === 0 ? (
        <PageSkeleton kind="meetings" />
      ) : error && !query.data ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">
            Failed to connect to meetings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMeetings}
            className="mt-4 text-xs"
          >
            Try Again
          </Button>
        </div>
      ) : meetings.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Video className="h-8 w-8 text-muted-foreground" />}
            title="No meetings in workspace"
            description="You haven't added any meetings yet. Click 'Add Meeting' to upload a transcript or schedule a call."
          />
        </div>
      ) : (
        /* Real Database-Backed Meetings */
        <MeetingList meetings={meetings} />
      )}
    </div>
  );
}
