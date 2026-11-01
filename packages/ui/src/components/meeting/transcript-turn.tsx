import * as React from 'react';
import { SpeakerAvatar } from './speaker-avatar';
import { TimestampLink } from './timestamp-link';
import { cn } from '../../lib/utils';

export interface TranscriptTurnProps extends React.HTMLAttributes<HTMLDivElement> {
  speakerName: string;
  startTime: number;
  endTime?: number;
  text: string;
  isActive?: boolean;
  isBookmarked?: boolean;
  onSeek?: (seconds: number) => void;
  onBookmark?: (startTime: number) => void;
}

export function TranscriptTurn({
  speakerName,
  startTime,
  text,
  isActive = false,
  isBookmarked = false,
  onSeek,
  className,
  ...props
}: TranscriptTurnProps) {
  return (
    <div
      className={cn(
        'group flex gap-3 rounded-lg p-2.5 transition-colors select-text',
        isActive
          ? 'bg-primary/10 ring-1 ring-primary/20'
          : 'hover:bg-muted/40',
        isBookmarked && 'border-l-2 border-l-primary',
        className
      )}
      {...props}
    >
      <div className="pt-0.5">
        <SpeakerAvatar name={speakerName} size="sm" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              {speakerName}
            </span>
            <TimestampLink seconds={startTime} onSeek={onSeek} />
          </div>
        </div>

        <p
          className={cn(
            'text-xs leading-relaxed transition-colors',
            isActive ? 'text-foreground font-medium' : 'text-foreground/90'
          )}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
