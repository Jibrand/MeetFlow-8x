import { Link } from '@tanstack/react-router';
import { MeetingItem } from '../../types/meeting';
import { MeetingStatusBadge } from '@meetflow/ui';
import { MeetingActions } from './meeting-actions';
import { Video, CheckSquare, Bookmark } from 'lucide-react';
import {
  formatDuration,
  formatMeetingDate,
  PLATFORM_LABEL,
} from '../../lib/meeting-format';
import { ParticipantOverflow } from '../meeting-detail/components/participant-overflow';

export interface MeetingRowProps {
  meeting: MeetingItem;
}

export function MeetingRow({ meeting }: MeetingRowProps) {
  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:px-4 sm:py-3 transition-colors hover:border-border hover:bg-secondary/40">
      <Link
        to="/meetings/$meetingId"
        params={{ meetingId: meeting.id }}
        className="flex items-start sm:items-center gap-3 min-w-0 flex-1 select-none"
      >
        {/* Platform Indicator */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
          <Video className="h-4 w-4" />
        </div>

        {/* Title & Metadata */}
        <div className="flex flex-col min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {meeting.title}
            </span>
            <span className="hidden md:inline-flex rounded bg-secondary px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground uppercase">
              {PLATFORM_LABEL[meeting.platform]}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span>{formatMeetingDate(meeting.startDate)}</span>
            <span className="text-muted-foreground/60">·</span>
            <span>{formatDuration(meeting.durationSeconds)}</span>

            {meeting.actionItemCount > 0 && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <CheckSquare className="h-3 w-3 text-primary" />
                  <span>{meeting.actionItemCount} actions</span>
                </span>
              </>
            )}

            {meeting.highlightCount > 0 && (
              <>
                <span className="text-muted-foreground/60">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <Bookmark className="h-3 w-3 text-primary" />
                  <span>{meeting.highlightCount} highlights</span>
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Right Column: Avatars, Status, Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
        {/* Participant Overflow Stack */}
        <ParticipantOverflow
          participants={meeting.participants}
          maxVisible={4}
          size="xs"
        />

        {/* Status Badge */}
        <MeetingStatusBadge status={meeting.status} />

        {/* Action Dropdown Menu */}
        <MeetingActions meeting={meeting} />
      </div>
    </div>
  );
}
