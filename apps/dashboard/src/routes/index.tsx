import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { SEEDED_MEETINGS } from '../data/seeded-meetings';
import { MeetingList } from '../features/meetings/meeting-list';
import { AddMeetingDialog } from '../features/meetings/add-meeting-dialog';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MeetingsPage,
});

export function MeetingsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            My Meetings
          </h1>
          <p className="text-xs text-muted-foreground">
            Search meeting transcripts, review AI summaries, and monitor automated action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AddMeetingDialog />
        </div>
      </div>

      {/* Meeting Library Table / List */}
      <MeetingList meetings={SEEDED_MEETINGS} />
    </div>
  );
}
