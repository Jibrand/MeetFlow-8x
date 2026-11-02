import * as React from 'react';
import type { MeetingFiltersState } from '../features/meetings/meeting-filters';
import { useMeetingPage } from '../features/meetings/use-meetings';
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
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState<MeetingFiltersState>(() => {
    let layout: 'list' | 'grid' = 'grid';
    try {
      if (localStorage.getItem('meetflow-meeting-layout-preference') === 'list')
        layout = 'list';
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status') || 'all';
    const platform = params.get('platform') || 'all';
    const sort = params.get('sort') || 'newest';
    return {
      search: params.get('q') || '',
      status: ([
        'all',
        'ready',
        'processing',
        'scheduled',
        'failed',
        'cancelled',
      ].includes(status)
        ? status
        : 'all') as MeetingFiltersState['status'],
      platform: (['all', 'zoom', 'meet', 'teams', 'upload'].includes(platform)
        ? platform
        : 'all') as MeetingFiltersState['platform'],
      sort: (['newest', 'oldest', 'longest'].includes(sort)
        ? sort
        : 'newest') as MeetingFiltersState['sort'],
      layout:
        params.get('layout') === 'list'
          ? 'list'
          : params.get('layout') === 'grid'
            ? 'grid'
            : layout,
    };
  });
  const [search, setSearch] = React.useState(filters.search);
  React.useEffect(() => {
    if (search === filters.search) return;
    const timer = setTimeout(() => {
      setSearch(filters.search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search, search]);
  const query = useMeetingPage(page, { ...filters, search });
  const changeFilters = (next: MeetingFiltersState) => {
    setFilters(next);
    if (next.search === filters.search) setPage(1);
  };
  React.useEffect(() => {
    if (query.data && page > 1 && query.data.meetings.length === 0)
      setPage(Math.max(1, Math.ceil(query.data.total / 9)));
  }, [query.data, page]);
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
          <AddMeetingDialog
            onMeetingCreated={() => {
              setPage(1);
              setSearch('');
              setFilters((old) => ({
                ...old,
                search: '',
                status: 'all',
                platform: 'all',
                sort: 'newest',
              }));
            }}
          />
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
        <MeetingList
          meetings={[]}
          server={{
            loading: true,
            page,
            total: 0,
            filters,
            onFiltersChange: changeFilters,
            onPageChange: setPage,
          }}
        />
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
      ) : meetings.length === 0 &&
        !filters.search &&
        filters.status === 'all' &&
        filters.platform === 'all' ? (
        <div className="py-12">
          <EmptyState
            icon={<Video className="h-8 w-8 text-muted-foreground" />}
            title="No meetings in workspace"
            description="You haven't added any meetings yet. Click 'Add Meeting' to upload a transcript or schedule a call."
          />
        </div>
      ) : (
        /* Real Database-Backed Meetings */
        <MeetingList
          meetings={meetings}
          server={{
            page,
            total: query.data?.total ?? 0,
            filters,
            onFiltersChange: changeFilters,
            onPageChange: setPage,
          }}
        />
      )}
    </div>
  );
}
