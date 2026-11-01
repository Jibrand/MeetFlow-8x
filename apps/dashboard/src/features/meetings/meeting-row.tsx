import { Link } from '@tanstack/react-router';
import { MeetingItem } from '../../types/meeting';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  MeetingMetadata,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
  toast,
} from '@meetflow/ui';
import { Video, MoreHorizontal, CheckSquare, Bookmark, Share2 } from 'lucide-react';

export interface MeetingRowProps {
  meeting: MeetingItem;
}

export function MeetingRow({ meeting }: MeetingRowProps) {
  const platformLabel = {
    zoom: 'Zoom',
    meet: 'Google Meet',
    teams: 'Teams',
    upload: 'Upload',
  }[meeting.platform];

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-3 sm:px-4 sm:py-3 transition-colors hover:border-border hover:bg-muted/30 shadow-2xs">
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
            <span className="hidden md:inline-flex rounded bg-muted px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground uppercase">
              {platformLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <MeetingMetadata
              date={meeting.startDate}
              durationSeconds={meeting.durationSeconds}
              compact
            />

            {meeting.actionItemCount > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <CheckSquare className="h-3 w-3 text-primary opacity-80" />
                  <span>{meeting.actionItemCount} actions</span>
                </span>
              </>
            )}

            {meeting.highlightCount > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <Bookmark className="h-3 w-3 text-amber-500 opacity-80" />
                  <span>{meeting.highlightCount} highlights</span>
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Right Column: Avatars, Status, Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
        {/* Participant Stack */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {meeting.participants.slice(0, 4).map((p) => (
            <SpeakerAvatar key={p.id} name={p.name} size="xs" />
          ))}
          {meeting.participants.length > 4 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border bg-muted text-[8px] font-bold text-muted-foreground select-none">
              +{meeting.participants.length - 4}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <MeetingStatusBadge status={meeting.status} />

        {/* Action Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Meeting actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard?.writeText(
                  `${window.location.origin}/meetings/${meeting.id}`
                );
                toast.success('Meeting link copied to clipboard!');
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
  );
}
