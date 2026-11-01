import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { MeetingStatusBadge, SpeakerAvatar, Checkbox, toast } from '@meetflow/ui';
import { Video, Clock, CheckSquare, CheckCircle2, AlertTriangle, Sparkles, XCircle } from 'lucide-react';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
import { useActionItems, isOverdue, parseDueDate } from '../actions/use-action-items';
import { toggleActionItemCompleted } from '../meeting-detail/lib/action-items-store';
import { formatDuration, formatMeetingDate } from '../../lib/meeting-format';
import { KpiCard, SectionCard } from './overview-cards';
import { MeetingsOverTimeChart, ActionItemDonut } from './overview-charts';

export function OverviewView() {
  const actionItems = useActionItems();
  const now = React.useMemo(() => new Date(), []);

  const recorded = SEEDED_MEETINGS.filter((m) => m.status === 'ready' || m.status === 'processing');
  const hours = recorded.reduce((s, m) => s + m.durationSeconds, 0) / 3600;
  const openItems = actionItems.filter((i) => !i.completed);
  const doneCount = actionItems.length - openItems.length;
  const overdue = openItems.filter((i) => isOverdue(i, now));

  const recent = [...SEEDED_MEETINGS]
    .filter((m) => m.status !== 'scheduled')
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    .slice(0, 5);

  const attention = [...openItems]
    .sort((a, b) => (parseDueDate(a.dueDate)?.getTime() ?? Infinity) - (parseDueDate(b.dueDate)?.getTime() ?? Infinity))
    .slice(0, 5);

  const activity = [...SEEDED_MEETINGS]
    .filter((m) => m.status !== 'scheduled')
    .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    .slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* 1. Compact Welcome Heading */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Good to see you, Jibran
        </h1>
        <p className="mt-0.5 text-xs sm:text-[13px] text-muted-foreground">
          Real-time meeting intelligence and action items overview.
        </p>
      </div>

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total meetings" value={SEEDED_MEETINGS.length} hint={`${recorded.length} recorded`} icon={Video} />
        <KpiCard label="Recorded hours" value={hours.toFixed(1)} hint="Across ready & processing" icon={Clock} />
        <KpiCard label="Open action items" value={openItems.length} hint={overdue.length ? `${overdue.length} overdue` : 'None overdue'} icon={CheckSquare} />
        <KpiCard label="Completed" value={doneCount} hint={`of ${actionItems.length} total`} icon={CheckCircle2} />
      </div>

      {/* 3. Analytics Row (Recharts) placed near the top */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Meetings over time (Past 7 Days)">
          <MeetingsOverTimeChart meetings={SEEDED_MEETINGS} now={now} />
        </SectionCard>
        <SectionCard title="Action item resolution">
          <ActionItemDonut items={actionItems} />
        </SectionCard>
      </div>

      {/* 4. Recent Meetings and Action Items */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Recent meetings" action={{ label: 'View all', to: '/' }} className="lg:col-span-2">
          <ul className="-mx-2 divide-y divide-border">
            {recent.map((m) => (
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
                      {formatMeetingDate(m.startDate)} · {formatDuration(m.durationSeconds)} · {m.participants.length} participants
                    </p>
                  </div>
                  <div className="hidden -space-x-1.5 sm:flex">
                    {m.participants.slice(0, 3).map((p) => (
                      <SpeakerAvatar key={p.id} name={p.name} size="xs" className="ring-2 ring-card" />
                    ))}
                  </div>
                  <MeetingStatusBadge status={m.status} />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Needs attention" action={{ label: 'All tasks', to: '/actions' }}>
          {attention.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No open action items. Nice work.</p>
          ) : (
            <ul className="space-y-2.5">
              {attention.map((item) => {
                const late = isOverdue(item, now);
                return (
                  <li key={item.id} className="flex items-start gap-2.5">
                    <Checkbox
                      className="mt-0.5"
                      checked={item.completed}
                      aria-label={`Mark "${item.title}" complete`}
                      onCheckedChange={(v) => {
                        toggleActionItemCompleted(item.id, Boolean(v));
                        if (v) toast.success('Task marked complete');
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-snug">{item.title}</p>
                      <p className={late ? 'mt-0.5 text-[11px] text-destructive' : 'mt-0.5 text-[11px] text-muted-foreground'}>
                        {late && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                        {item.dueDate ? `Due ${formatMeetingDate(item.dueDate + 'T12:00:00')}` : 'No due date'}
                        {item.assigneeName ? ` · ${item.assigneeName}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* 5. Recent Activity */}
      <SectionCard title="Recent activity">
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {activity.map((m) => {
            const Icon = m.status === 'failed' ? XCircle : m.status === 'processing' ? Sparkles : CheckCircle2;
            const verb = m.status === 'failed' ? 'Processing failed' : m.status === 'processing' ? 'Processing' : 'Summary ready';
            return (
              <li key={m.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                <Icon className={m.status === 'failed' ? 'mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive' : 'mt-0.5 h-3.5 w-3.5 shrink-0 text-primary'} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground">{verb}</p>
                  <p className="truncate text-xs font-medium text-foreground">{m.title}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}
