import { Play } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface EvidenceLinkProps {
  seconds: number;
  onSeek: (seconds: number) => void;
  className?: string;
}

export function EvidenceLink({ seconds, onSeek, className = '' }: EvidenceLinkProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSeek(seconds);
      }}
      className={`inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-mono font-medium text-primary hover:bg-primary/20 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none ${className}`}
      title={`Seek recording to ${formatSecondsToTime(seconds)}`}
    >
      <Play className="h-2.5 w-2.5 fill-primary" />
      <span>{formatSecondsToTime(seconds)}</span>
    </button>
  );
}
