import * as React from 'react';
import { Checkbox } from '../checkbox';
import { Badge } from '../badge';
import { SpeakerAvatar } from './speaker-avatar';
import { TimestampLink } from './timestamp-link';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ActionItemPriority = 'low' | 'medium' | 'high';

export interface ActionItemRowProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  title: string;
  completed?: boolean;
  onToggleCompleted?: (completed: boolean) => void;
  assigneeName?: string | null;
  dueDate?: string | null;
  priority?: ActionItemPriority;
  timestampSeconds?: number;
  onSeek?: (seconds: number) => void;
}

export function ActionItemRow({
  title,
  completed = false,
  onToggleCompleted,
  assigneeName,
  dueDate,
  priority,
  timestampSeconds,
  onSeek,
  className,
  ...props
}: ActionItemRowProps) {
  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2 text-xs transition-colors hover:border-border hover:bg-muted/30 select-none',
        completed && 'opacity-60 bg-muted/20',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Checkbox
          checked={completed}
          onCheckedChange={(val) => onToggleCompleted?.(Boolean(val))}
          className="h-4 w-4 shrink-0 transition-transform active:scale-90"
        />
        <span
          className={cn(
            'truncate font-medium text-foreground transition-all',
            completed && 'line-through text-muted-foreground'
          )}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {timestampSeconds !== undefined && (
          <TimestampLink seconds={timestampSeconds} onSeek={onSeek} />
        )}

        {priority && (
          <Badge
            variant={
              priority === 'high'
                ? 'destructive'
                : priority === 'medium'
                ? 'warning'
                : 'secondary'
            }
            className="text-[9px] uppercase px-1.5 py-0"
          >
            {priority}
          </Badge>
        )}

        {formattedDueDate && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3 opacity-60" />
            <span>{formattedDueDate}</span>
          </div>
        )}

        {assigneeName && <SpeakerAvatar name={assigneeName} size="xs" />}
      </div>
    </div>
  );
}
