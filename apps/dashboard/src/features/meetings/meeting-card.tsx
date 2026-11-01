import { Link } from '@tanstack/react-router';
import { MeetingItem } from '../../types/meeting';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
  toast,
} from '@meetflow/ui';
import { Video, MoreHorizontal, CheckSquare, Bookmark, Share2 } from 'lucide-react';
import { formatDuration, formatMeetingDate, PLATFORM_LABEL } from '../../lib/meeting-format';

export interface MeetingCardProps {
  meeting: MeetingItem;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-border hover:shadow-xs">
      <div>
        {/* Top platform & status row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
              <Video className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {PLATFORM_LABEL[meeting.platform]}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MeetingStatusBadge status={meeting.status} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  aria-label="Meeting actions"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard?.writeText(`${window.location.origin}/meetings/${meeting.id}`);
                    toast.success('Meeting link copied to clipboard');
                  }}
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Exporting meeting summary...')}>
                  Export Summary
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => toast.error('Delete simulated in seed mode')}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <Link
          to="/meetings/$meetingId"
          params={{ meetingId: meeting.id }}
          className="mt-2.5 block focus-visible:outline-none"
        >
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            {meeting.title}
          </h3>
        </Link>

        {/* Summary preview */}
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {meeting.previewSummary}
        </p>
      </div>

      {/* Bottom meta row */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>{formatMeetingDate(meeting.startDate)}</span>
          <span>·</span>
          <span>{formatDuration(meeting.durationSeconds)}</span>
        </div>

        <div className="flex items-center gap-2">
          {meeting.actionItemCount > 0 && (
            <span className="flex items-center gap-0.5" title={`${meeting.actionItemCount} action items`}>
              <CheckSquare className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px]">{meeting.actionItemCount}</span>
            </span>
          )}
          {meeting.highlightCount > 0 && (
            <span className="flex items-center gap-0.5" title={`${meeting.highlightCount} highlights`}>
              <Bookmark className="h-3 w-3 text-primary" />
              <span className="font-mono text-[10px]">{meeting.highlightCount}</span>
            </span>
          )}
          <div className="flex items-center -space-x-1 ml-1">
            {meeting.participants.slice(0, 3).map((p) => (
              <SpeakerAvatar key={p.id} name={p.name} size="xs" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
