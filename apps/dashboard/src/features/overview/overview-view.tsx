import { PageSkeleton } from '../../components/page-skeleton';
import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  Checkbox,
  Button,
} from '@meetflow/ui';
import {
  Video,
  Clock,
  CheckSquare,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useActionItemsQuery, parseDueDate } from '../actions/use-action-items';
import { useMeetingsQuery, workspaceScope } from '../meetings/use-meetings';
import { useToggleActionItem } from '../actions/use-toggle-action-item';
import { formatDuration, formatMeetingDate } from '../../lib/meeting-format';
import { KpiCard, SectionCard } from './overview-cards';
import { MeetingsOverTimeChart, ActionItemDonut } from './overview-charts';
import {
  apiFetchOverviewStats,
  mapBackendMeetingToItem,
  mapBackendActionItem,
} from '../meetings/meetings-api';
import { AddMeetingDialog } from '../meetings/add-meeting-dialog';

export function OverviewView() {
  const taskToggle = useToggleActionItem();
  const now = React.useMemo(() => new Date(), []);
  const stats = useQuery({
    queryKey: ['overview', workspaceScope()],
    queryFn: ({ signal }) => apiFetchOverviewStats(signal),
    retry: false,
    gcTime: 300_000,
    staleTime: 30_000,
  });
  const meetings = useMeetingsQuery();
  const items = useActionItemsQuery();
  const loading = stats.isPending || meetings.isPending || items.isPending;
  const error = stats.error || meetings.error || items.error;
  const loadStats = () => {
    void stats.refetch();
    void meetings.refetch();
    void items.refetch();
  };
  if (loading)
    return (
      <div className="max-w-6xl mx-auto p-6">
        <PageSkeleton kind="overview" />
      </div>
    );
  if (!stats.data || !meetings.data || !items.data)
    return (
      <div role="alert" className="p-6 space-y-3">
        <p>{error?.message || 'Unable to load overview.'}</p>
        <Button variant="outline" onClick={loadStats}>
          Try Again
        </Button>
      </div>
    );
  const dbStats = stats.data;
  const totalMeetings = dbStats.totalMeetings;
  const recordedMeetingsCount = dbStats.recordedMeetings;
  const recordedHours = dbStats.totalHours;
  const openCount = dbStats.openActionItems;
  const doneCount = dbStats.completedActionItems;
  const overdueCount = dbStats.overdueActionItems;
  const recentMeetings = dbStats.recentMeetings.map(mapBackendMeetingToItem);
  const attentionItems = dbStats.attentionItems.map(mapBackendActionItem);
  const handleComplete = taskToggle.toggle;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* 1. Compact Welcome Heading & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Meeting overview
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] text-muted-foreground">
            Real-time meeting intelligence and action items overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
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

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 p-3 text-xs"
        >
          <span>Could not refresh overview. {error.message}</span>
          <Button variant="outline" size="sm" onClick={loadStats}>
            Try Again
          </Button>
        </div>
      )}

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total meetings"
          value={totalMeetings}
          hint={`${recordedMeetingsCount} recorded`}
          icon={Video}
        />
        <KpiCard
          label="Recorded hours"
          value={Number(recordedHours).toFixed(1)}
          hint="Across ready & processing"
          icon={Clock}
        />
        <KpiCard
          label="Open action items"
          value={openCount}
          hint={overdueCount ? `${overdueCount} overdue` : 'None overdue'}
          icon={CheckSquare}
        />
        <KpiCard
          label="Completed"
          value={doneCount}
          hint={`of ${openCount + doneCount} total`}
          icon={CheckCircle2}
        />
      </div>

      {/* 3. Analytics Row (Recharts) */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Meetings over time (Past 7 Days)">
          <MeetingsOverTimeChart
            meetings={meetings.data?.meetings ?? []}
            now={now}
          />
        </SectionCard>
        <SectionCard title="Action item resolution">
          <ActionItemDonut items={items.data ?? []} />
        </SectionCard>
      </div>

      {/* 4. Recent Meetings and Action Items */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Recent meetings"
          action={{ label: 'View all', to: '/' }}
          className="lg:col-span-2"
        >
          {recentMeetings.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No meetings recorded in this workspace yet. Click 'Add Meeting' to
              get started.
            </p>
          ) : (
            <ul className="-mx-2 divide-y divide-border">
              {recentMeetings.map((m) => (
                <li key={m.id}>
                  <Link
                    to="/meetings/$meetingId"
                    params={{ meetingId: m.id }}
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-secondary/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatMeetingDate(m.startDate)} ·{' '}
                        {formatDuration(m.durationSeconds)} ·{' '}
                        {m.participants.length} participants
                      </p>
                    </div>
                    <div className="hidden -space-x-1.5 sm:flex">
                      {m.participants.slice(0, 3).map((p) => (
                        <SpeakerAvatar
                          key={p.id}
                          name={p.name}
                          size="xs"
                          className="ring-2 ring-card"
                        />
                      ))}
                    </div>
                    <MeetingStatusBadge status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Needs attention"
          action={{ label: 'All tasks', to: '/actions' }}
        >
          {attentionItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No open action items. Nice work.
            </p>
          ) : (
            <ul className="-mx-2 divide-y divide-border">
              {attentionItems.map((item) => {
                const due = parseDueDate(item.dueDate);
                const isItemOverdue = due && due < now;
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5 px-2 py-2.5"
                  >
                    <div className="mt-0.5">
                      <Checkbox
                        checked={item.completed}
                        disabled={taskToggle.pendingIds.has(item.id)}
                        aria-label={`Complete ${item.title}`}
                        onCheckedChange={() => {
                          void handleComplete(item.id, !item.completed);
                        }}
                      />
                      {taskToggle.pendingIds.has(item.id) && (
                        <span role="status" aria-label="Saving task">
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        {item.assigneeName && <span>{item.assigneeName}</span>}
                        {item.dueDate && (
                          <span
                            className={
                              isItemOverdue
                                ? 'text-destructive font-medium'
                                : ''
                            }
                          >
                            {formatMeetingDate(item.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
