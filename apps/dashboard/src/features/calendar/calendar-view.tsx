import { Link } from '@tanstack/react-router';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  MeetingMetadata,
  Button,
  Badge,
} from '@meetflow/ui';
import { Calendar as CalendarIcon, ExternalLink, Video, AlertCircle } from 'lucide-react';

export function CalendarView() {
  // Sort meetings by date
  const sortedMeetings = [...SEEDED_MEETINGS].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Calendar & Schedule
          </h1>
          <p className="text-xs text-muted-foreground">
            Upcoming calls and previous meeting schedule timeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Google Calendar: Disconnected</span>
          </Badge>
        </div>
      </div>

      {/* Honest Calendar Connection Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-2xs">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground">Google Calendar Integration Notice</p>
          <p className="text-muted-foreground leading-relaxed">
            Direct Google OAuth sync is currently disconnected for the 8x assignment MVP. Below is an agenda view constructed from your seeded meetings and upcoming schedule.
          </p>
        </div>
      </div>

      {/* Agenda Timeline List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Meeting Schedule Agenda ({sortedMeetings.length} calls)
          </h2>
        </div>

        <div className="space-y-2">
          {sortedMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-3 sm:px-4 sm:py-3 transition-colors hover:border-border hover:bg-muted/30 shadow-2xs"
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
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground uppercase">
                      {meeting.platform}
                    </span>
                  </div>

                  <MeetingMetadata
                    date={meeting.startDate}
                    durationSeconds={meeting.durationSeconds}
                    attendeeCount={meeting.participants.length}
                    compact
                  />
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="flex items-center -space-x-1.5">
                  {meeting.participants.slice(0, 3).map((p) => (
                    <SpeakerAvatar key={p.id} name={p.name} size="xs" />
                  ))}
                </div>

                <MeetingStatusBadge status={meeting.status} />

                <Link
                  to="/meetings/$meetingId"
                  params={{ meetingId: meeting.id }}
                >
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <span>Open</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
