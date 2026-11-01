import * as React from 'react';
import { Bookmark, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TimestampLink } from './timestamp-link';

export interface HighlightChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  timestampSeconds?: number;
  tag?: string;
  onSeek?: (seconds: number) => void;
  onRemove?: () => void;
}

export function HighlightChip({
  label,
  timestampSeconds,
  tag,
  onSeek,
  onRemove,
  className,
  ...props
}: HighlightChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-primary/10 select-none shadow-2xs',
        className
      )}
      {...props}
    >
      <Bookmark className="h-3 w-3 text-primary shrink-0 fill-primary/20" />
      <span className="font-medium text-[11px] truncate max-w-[140px]">{label}</span>

      {tag && (
        <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-semibold text-muted-foreground uppercase">
          {tag}
        </span>
      )}

      {timestampSeconds !== undefined && (
        <TimestampLink
          seconds={timestampSeconds}
          onSeek={onSeek}
          className="px-1 py-0 text-[10px] text-primary hover:bg-transparent"
        />
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus:outline-none"
          title="Remove highlight"
        >
          <X className="h-2.5 w-2.5" />
          <span className="sr-only">Remove</span>
        </button>
      )}
    </div>
  );
}
