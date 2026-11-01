import * as React from 'react';
import { cn } from '../../lib/utils';
import { Play } from 'lucide-react';

export interface TimestampLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  seconds: number;
  onSeek?: (seconds: number) => void;
  showPlayIcon?: boolean;
}

export function formatSecondsToTime(totalSeconds: number): string {
  const rounded = Math.floor(Math.max(0, totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const TimestampLink = React.forwardRef<HTMLButtonElement, TimestampLinkProps>(
  ({ seconds, onSeek, showPlayIcon = false, className, ...props }, ref) => {
    const formatted = formatSecondsToTime(seconds);

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onSeek?.(seconds)}
        className={cn(
          'group inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none',
          className
        )}
        title={`Jump to ${formatted}`}
        {...props}
      >
        {showPlayIcon && (
          <Play className="h-2.5 w-2.5 fill-current opacity-70 group-hover:opacity-100 transition-opacity" />
        )}
        <span>{formatted}</span>
      </button>
    );
  }
);
TimestampLink.displayName = 'TimestampLink';
