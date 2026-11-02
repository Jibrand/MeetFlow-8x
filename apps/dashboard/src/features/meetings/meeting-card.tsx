import { Link } from '@tanstack/react-router';
import { MeetingItem } from '../../types/meeting';
import { MeetingStatusBadge } from '@meetflow/ui';
import { MeetingActions } from './meeting-actions';
import { Video, CheckSquare, Bookmark, Play, AudioLines } from 'lucide-react';
import {
  formatDuration,
  formatMeetingDate,
  PLATFORM_LABEL,
} from '../../lib/meeting-format';
import { ParticipantOverflow } from '../meeting-detail/components/participant-overflow';

export interface MeetingCardProps {
  meeting: MeetingItem;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const hasVideo = Boolean(meeting.videoUrl);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
      {/* 1. Recording Preview Thumbnail (16:9 Aspect Ratio) */}
      <Link
        to="/meetings/$meetingId"
        params={{ meetingId: meeting.id }}
        className="relative block aspect-video w-full overflow-hidden bg-muted/60 border-b border-border/60"
        tabIndex={-1}
      >
        {hasVideo ? (
          /* Actual permitted demo video preview frame */
          <div className="relative h-full w-full bg-black/90 flex items-center justify-center">
            <video
              src={meeting.videoUrl}
              muted
              playsInline
              className="h-full w-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-md backdrop-blur-xs transition-transform group-hover:scale-110">
                <Play className="h-4 w-4 ml-0.5 fill-current" />
              </span>
            </div>
          </div>
        ) : (
          /* Generic, honest recording preview canvas (subtle soundbars + platform watermark) */
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/80 to-muted/40 p-4">
            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-60 transition-opacity">
              {[40, 70, 45, 90, 60, 30, 85, 50, 75, 40, 65, 80].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-primary/70"
                  style={{ height: `${h * 0.4}px` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card/80 text-muted-foreground shadow-2xs backdrop-blur-xs group-hover:text-primary transition-colors">
                <AudioLines className="h-4 w-4" />
              </span>
            </div>
          </div>
        )}

        {/* Duration badge pinned bottom-right */}
        <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-xs shadow-2xs">
          {formatDuration(meeting.durationSeconds)}
        </span>

        {/* Platform badge pinned top-left */}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
          <Video className="h-2.5 w-2.5 text-primary" />
          <span>{PLATFORM_LABEL[meeting.platform]}</span>
        </span>
      </Link>

      {/* 2. Content Body */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          {/* Header row: Status + Context Menu */}
          <div className="flex items-center justify-between gap-2">
            <MeetingStatusBadge status={meeting.status} />

            <MeetingActions meeting={meeting} />
          </div>

          {/* Title */}
          <Link
            to="/meetings/$meetingId"
            params={{ meetingId: meeting.id }}
            className="mt-2 block focus-visible:outline-none"
          >
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
              {meeting.title}
            </h3>
          </Link>

          {/* Summary Preview */}
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {meeting.previewSummary}
          </p>
        </div>

        {/* 3. Bottom Meta Row */}
        <div className="mt-3.5 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <span>{formatMeetingDate(meeting.startDate)}</span>

          <div className="flex items-center gap-2">
            {meeting.actionItemCount > 0 && (
              <span
                className="flex items-center gap-0.5"
                title={`${meeting.actionItemCount} action items`}
              >
                <CheckSquare className="h-3 w-3 text-primary" />
                <span className="font-mono text-[10px]">
                  {meeting.actionItemCount}
                </span>
              </span>
            )}
            {meeting.highlightCount > 0 && (
              <span
                className="flex items-center gap-0.5"
                title={`${meeting.highlightCount} highlights`}
              >
                <Bookmark className="h-3 w-3 text-primary" />
                <span className="font-mono text-[10px]">
                  {meeting.highlightCount}
                </span>
              </span>
            )}
            <ParticipantOverflow
              participants={meeting.participants}
              maxVisible={3}
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
