import * as React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatSecondsToTime } from './timestamp-link';

export interface MeetingMetadataProps extends React.HTMLAttributes<HTMLDivElement> {
  date: string | Date;
  durationSeconds: number;
  attendeeCount?: number;
  compact?: boolean;
}

export function MeetingMetadata({
  date,
  durationSeconds,
  attendeeCount,
  compact = false,
  className,
  ...props
}: MeetingMetadataProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      })
    : String(date);

  const durationFormatted =
    durationSeconds >= 3600
      ? `${Math.floor(durationSeconds / 3600)}h ${Math.floor((durationSeconds % 3600) / 60)}m`
      : durationSeconds > 0
      ? `${Math.round(durationSeconds / 60)}m`
      : formatSecondsToTime(durationSeconds);

  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
        compact && 'gap-2 text-[11px]',
        className
      )}
      {...props}
    >
      <div className="inline-flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5 opacity-70" />
        <span>{formattedDate}</span>
      </div>

      <div className="h-3 w-[1px] bg-border/80" />

      <div className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 opacity-70" />
        <span>{durationFormatted}</span>
      </div>

      {attendeeCount !== undefined && attendeeCount > 0 && (
        <>
          <div className="h-3 w-[1px] bg-border/80" />
          <div className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 opacity-70" />
            <span>
              {attendeeCount} {attendeeCount === 1 ? 'attendee' : 'attendees'}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
