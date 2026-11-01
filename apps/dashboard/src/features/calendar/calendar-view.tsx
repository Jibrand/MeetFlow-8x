import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  Button,
  Badge,
} from '@meetflow/ui';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Video,
  Clock,
  List,
} from 'lucide-react';
import {
  formatDuration,
  formatMeetingDate,
  formatMeetingTime,
  groupMeetingsByDate,
  PLATFORM_LABEL,
} from '../../lib/meeting-format';

export function CalendarView() {
  const [viewMode, setViewMode] = React.useState<'month' | 'agenda'>('month');

  // November 2026 is the base month for seeded meetings
  const [currentMonthDate, setCurrentMonthDate] = React.useState<Date>(() => new Date(2026, 10, 1));
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>('2026-11-01');

  // Sorted meetings
  const sortedMeetings = React.useMemo(() => {
    return [...SEEDED_MEETINGS].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, []);

  // Meetings mapped by YYYY-MM-DD
  const meetingsByDateMap = React.useMemo(() => {
    const map = new Map<string, typeof SEEDED_MEETINGS>();
    sortedMeetings.forEach((m) => {
      const d = new Date(m.startDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(m);
      map.set(key, list);
    });
    return map;
  }, [sortedMeetings]);

  // Selected date meetings
  const selectedMeetings = React.useMemo(() => {
    return meetingsByDateMap.get(selectedDateStr) || [];
  }, [meetingsByDateMap, selectedDateStr]);

  // Agenda grouped meetings
  const groupedAgenda = React.useMemo(() => {
    return groupMeetingsByDate(sortedMeetings);
  }, [sortedMeetings]);

  // Month grid calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setCurrentMonthDate(new Date(2026, 10, 1));
    setSelectedDateStr('2026-11-01');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Calendar & Schedule
          </h1>
          <p className="text-xs text-muted-foreground">
            View scheduled meetings, past recordings, and upcoming intelligence capture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="text-xs gap-1.5 py-1 text-muted-foreground font-normal">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            <span>Google Calendar: Disconnected</span>
          </Badge>

          {/* View Mode Toggle: Month vs Agenda */}
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' ? (
        /* Month Calendar View */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
            {/* Month Header Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  {monthName}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                >
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handlePrevMonth}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleNextMonth}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 pb-1 border-b border-border/60">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* 7-column Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-16 sm:min-h-20 rounded-lg p-1 opacity-25" />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const meetingsOnDay = meetingsByDateMap.get(dateKey) || [];
                const isSelected = selectedDateStr === dateKey;
                const hasMeetings = meetingsOnDay.length > 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`relative min-h-16 sm:min-h-20 rounded-lg border p-1.5 sm:p-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                        : hasMeetings
                        ? 'border-border/80 bg-secondary/50 hover:bg-secondary/80'
                        : 'border-border/40 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-primary font-bold'
                            : 'text-foreground'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {hasMeetings && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-2xs font-mono">
                          {meetingsOnDay.length}
                        </span>
                      )}
                    </div>

                    {hasMeetings && (
                      <div className="space-y-0.5 mt-1 overflow-hidden">
                        {meetingsOnDay.slice(0, 2).map((m) => (
                          <div
                            key={m.id}
                            className="truncate text-[9px] sm:text-[10px] text-muted-foreground font-medium"
                          >
                            • {m.title}
                          </div>
                        ))}
                        {meetingsOnDay.length > 2 && (
                          <div className="text-[9px] text-primary font-semibold">
                            +{meetingsOnDay.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer / List */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                  Meetings for {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedMeetings.length} {selectedMeetings.length === 1 ? 'meeting' : 'meetings'}
              </span>
            </div>

            {selectedMeetings.length > 0 ? (
              <div className="divide-y divide-border/60">
                {selectedMeetings.map((m) => (
                  <div key={m.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/meetings/$meetingId"
                          params={{ meetingId: m.id }}
                          className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {m.title}
                        </Link>
                        <MeetingStatusBadge status={m.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {formatMeetingTime(m.startDate)} · {formatDuration(m.durationSeconds)} · {PLATFORM_LABEL[m.platform]}
                      </p>
                    </div>

                    <Link
                      to="/meetings/$meetingId"
                      params={{ meetingId: m.id }}
                      className="shrink-0"
                    >
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        Open Meeting
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No meetings recorded or scheduled on this date.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="space-y-6">
          {groupedAgenda.map(({ group, meetings }) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </h3>
                <span className="text-[11px] font-mono text-muted-foreground/60">
                  ({meetings.length})
                </span>
              </div>

              <div className="space-y-2">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition-colors ${
                      meeting.status === 'scheduled'
                        ? 'border-dashed border-primary/50 bg-primary/5'
                        : 'border-border bg-card hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <Video className="h-4 w-4" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link
                            to="/meetings/$meetingId"
                            params={{ meetingId: meeting.id }}
                            className="truncate text-xs font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {meeting.title}
                          </Link>
                          <MeetingStatusBadge status={meeting.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{formatMeetingDate(meeting.startDate)} at {formatMeetingTime(meeting.startDate)}</span>
                          <span>·</span>
                          <span>{formatDuration(meeting.durationSeconds)}</span>
                          <span>·</span>
                          <span>{PLATFORM_LABEL[meeting.platform]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex items-center -space-x-1.5">
                        {meeting.participants.slice(0, 3).map((p) => (
                          <SpeakerAvatar key={p.id} name={p.name} size="xs" />
                        ))}
                      </div>
                      <Link
                        to="/meetings/$meetingId"
                        params={{ meetingId: meeting.id }}
                      >
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          {meeting.status === 'scheduled' ? 'View Schedule' : 'View Notes'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
