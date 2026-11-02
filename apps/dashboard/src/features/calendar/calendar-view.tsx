import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatusBadge, Button, Badge } from '@meetflow/ui';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  RefreshCw,
} from 'lucide-react';
import {
  formatDuration,
  formatMeetingDate,
  formatMeetingTime,
  groupMeetingsByDate,
  PLATFORM_LABEL,
} from '../../lib/meeting-format';
import { apiFetchMeetings } from '../meetings/meetings-api';
import { MeetingItem } from '../../types/meeting';
import { AddMeetingDialog } from '../meetings/add-meeting-dialog';

export function CalendarView() {
  const [viewMode, setViewMode] = React.useState<'month' | 'agenda'>('month');

  const [currentMonthDate, setCurrentMonthDate] = React.useState(
    () => new Date(),
  );
  const [selectedDateStr, setSelectedDateStr] = React.useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const query = useQuery({
    gcTime: 0,
    staleTime: 0,
    queryKey: ['meetings', 'calendar'],
    queryFn: () => apiFetchMeetings(),
    retry: false,
  });
  const meetings = query.data?.meetings ?? [];
  const loading = query.isPending;
  const loadBackendMeetings = () => {
    void query.refetch();
  };

  // Sorted meetings
  const sortedMeetings = React.useMemo(() => {
    return [...meetings].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  }, [meetings]);

  // Meetings mapped by YYYY-MM-DD
  const meetingsByDateMap = React.useMemo(() => {
    const map = new Map<string, MeetingItem[]>();
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

  // Calendar month computation
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDateStr(todayStr);
  };

  const monthName = currentMonthDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Calendar & Schedule
            </h1>
            <Badge variant="secondary" className="text-xs">
              {sortedMeetings.length} Meetings
            </Badge>
            {loading && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground ml-1" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Synchronized meeting schedules, transcripts, and intelligence review
            dates.
          </p>
        </div>

        {/* View Mode Toggle & Add Meeting Dialog */}
        <div className="flex items-center gap-2.5">
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

          <AddMeetingDialog onMeetingCreated={loadBackendMeetings} />
        </div>
      </div>

      {loading ? (
        <div role="status" aria-label="Loading calendar" className="space-y-3">
          <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/30" />
          <div className="h-24 animate-pulse rounded-lg bg-muted/30" />
        </div>
      ) : query.isError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 p-6 text-center space-y-3"
        >
          <p className="text-sm">
            {query.error.message || 'Unable to load calendar meetings.'}
          </p>
          <Button variant="outline" size="sm" onClick={loadBackendMeetings}>
            Try Again
          </Button>
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No meetings in this workspace yet. Add a meeting to see it here.
        </div>
      ) : viewMode === 'month' ? (
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

            {/* Calendar Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1 border-b border-border/60">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-20 sm:h-24 rounded-lg bg-muted/10 p-1 opacity-40"
                />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayMeetings = meetingsByDateMap.get(dateKey) || [];
                const isSelected = selectedDateStr === dateKey;
                const hasMeetings = dayMeetings.length > 0;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`h-20 sm:h-24 rounded-lg border p-1.5 flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-xs'
                        : hasMeetings
                          ? 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30'
                          : 'border-border/40 bg-card/50 hover:border-border hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {hasMeetings && (
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full px-1.5 py-0.2">
                          {dayMeetings.length}
                        </span>
                      )}
                    </div>

                    {/* Micro Meeting Pill Indicator */}
                    <div className="space-y-1 overflow-hidden">
                      {dayMeetings.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className="truncate rounded px-1 py-0.5 text-[9px] font-medium bg-secondary/80 text-foreground border border-border/40 flex items-center gap-1"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              m.status === 'ready'
                                ? 'bg-emerald-500'
                                : m.status === 'processing'
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-primary'
                            }`}
                          />
                          <span className="truncate">{m.title}</span>
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <p className="text-[9px] text-muted-foreground font-mono text-center">
                          +{dayMeetings.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer / List */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Meetings for{' '}
                  {formatMeetingDate(`${selectedDateStr}T12:00:00Z`)}
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedMeetings.length}{' '}
                {selectedMeetings.length === 1 ? 'meeting' : 'meetings'}
              </span>
            </div>

            {selectedMeetings.length > 0 ? (
              <div className="divide-y divide-border/60">
                {selectedMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
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
                        {formatMeetingTime(m.startDate)} ·{' '}
                        {formatDuration(m.durationSeconds)} ·{' '}
                        {PLATFORM_LABEL[m.platform]}
                      </p>
                    </div>

                    <Link
                      to="/meetings/$meetingId"
                      params={{ meetingId: m.id }}
                      className="shrink-0"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
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
                {meetings.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-primary/50 transition-colors"
                  >
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
                        {formatMeetingDate(m.startDate)} ·{' '}
                        {formatMeetingTime(m.startDate)} ·{' '}
                        {formatDuration(m.durationSeconds)}
                      </p>
                    </div>

                    <Link
                      to="/meetings/$meetingId"
                      params={{ meetingId: m.id }}
                      className="shrink-0"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        View Details
                      </Button>
                    </Link>
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
