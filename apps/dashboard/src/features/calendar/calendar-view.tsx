import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  Button,
  Badge,
} from '@meetflow/ui';
import { Calendar as CalendarIcon, ExternalLink, Video } from 'lucide-react';
import {
  formatDuration,
  formatMeetingDate,
  formatMeetingTime,
  groupMeetingsByDate,
  PLATFORM_LABEL,
} from '../../lib/meeting-format';

export function CalendarView() {
  const [viewMode, setViewMode] = React.useState<'agenda' | 'week'>('agenda');

  // Sort meetings by date
  const sortedMeetings = React.useMemo(() => {
    return [...SEEDED_MEETINGS].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, []);

  const grouped = React.useMemo(() => {
    return groupMeetingsByDate(sortedMeetings);
  }, [sortedMeetings]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Calendar & Schedule
          </h1>
          <p className="text-xs text-muted-foreground">
            Upcoming calls and previous meeting schedule timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs gap-1.5 py-1 text-muted-foreground font-normal">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            <span>Google Calendar: Disconnected</span>
          </Badge>

          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-secondary text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-secondary text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Week Timeline Strip (when Week View is active) */}
      {viewMode === 'week' && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>October 27 – November 2, 2026</span>
            <span className="text-muted-foreground font-normal text-[11px]">7-Day Snapshot</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-1 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
              const dayMeetings = sortedMeetings.filter((m) => {
                const d = new Date(m.startDate);
                // 0 is Sunday, 1 is Mon...
                const dayIdx = (d.getDay() + 6) % 7;
                return dayIdx === idx;
              });

              return (
                <div
                  key={day}
                  className="rounded-lg border border-border/60 bg-secondary/30 p-2.5 space-y-1.5"
                >
                  <span className="block text-[11px] font-semibold text-muted-foreground">{day}</span>
                  <span className="block text-xs font-mono font-medium text-foreground">
                    {27 + idx}
                  </span>
                  <div className="pt-1">
                    {dayMeetings.length > 0 ? (
                      <span className="inline-block rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                        {dayMeetings.length} {dayMeetings.length === 1 ? 'call' : 'calls'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grouped Agenda List */}
      <div className="space-y-6">
        {grouped.map(({ group, meetings }) => (
          <section key={group} className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground/60">
                ({meetings.length})
              </span>
            </div>

            <div className="space-y-2">
              {meetings.map((meeting) => {
                const isScheduled = meeting.status === 'scheduled';
                return (
                  <div
                    key={meeting.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:px-4 sm:py-3 transition-colors hover:border-border hover:bg-secondary/40 ${
                      isScheduled ? 'border-dashed border-primary/40 bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <Video className="h-4 w-4" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">
                            {meeting.title}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground uppercase">
                            {PLATFORM_LABEL[meeting.platform]}
                          </span>
                          {isScheduled && (
                            <Badge variant="outline" className="text-[9px] font-medium text-primary border-primary/30">
                              Upcoming Call
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{formatMeetingDate(meeting.startDate)}</span>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{formatMeetingTime(meeting.startDate)}</span>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{formatDuration(meeting.durationSeconds)}</span>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{meeting.participants.length} attendees</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <div className="flex items-center -space-x-1.5">
                        {meeting.participants.slice(0, 3).map((p) => (
                          <SpeakerAvatar key={p.id} name={p.name} size="xs" />
                        ))}
                      </div>

                      <MeetingStatusBadge status={meeting.status} />

                      <Link to="/meetings/$meetingId" params={{ meetingId: meeting.id }}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
