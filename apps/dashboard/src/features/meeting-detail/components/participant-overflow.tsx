import { useState } from 'react';
import { Participant } from '../../../types/meeting';
import {
  SpeakerAvatar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@meetflow/ui';

export interface ParticipantOverflowProps {
  participants: Participant[];
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'default';
  className?: string;
}

export function ParticipantOverflow({
  participants,
  maxVisible = 4,
  size = 'sm',
  className = '',
}: ParticipantOverflowProps) {
  const [open, setOpen] = useState(false);

  if (!participants || participants.length === 0) return null;

  const visible = participants.slice(0, maxVisible);
  const remaining = participants.slice(maxVisible);
  const remainingCount = remaining.length;

  return (
    <div className={`flex items-center -space-x-1.5 ${className}`}>
      {visible.map((p) => (
        <div key={p.id} title={`${p.name}${p.role ? ` (${p.role})` : ''}`}>
          <SpeakerAvatar
            name={p.name}
            size={size}
            className="ring-2 ring-card shadow-2xs transition-transform hover:scale-105"
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 min-w-5 sm:h-6 sm:min-w-6 items-center justify-center rounded-full bg-secondary px-1 text-[10px] sm:text-[11px] font-semibold text-secondary-foreground ring-2 ring-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`View ${remainingCount} more participants`}
            >
              +{remainingCount}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="w-64 p-3 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Additional Participants ({remainingCount})
                </span>
                <span className="text-[10px] text-muted-foreground">Total: {participants.length}</span>
              </div>
              <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                {remaining.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 rounded p-1 hover:bg-secondary/60">
                    <SpeakerAvatar name={p.name} size="xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                      {p.role && <p className="truncate text-[10px] text-muted-foreground">{p.role}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
