import * as React from 'react';
import { MeetingItem } from '../../../types/meeting';
import { Badge, Button, toast } from '@meetflow/ui';
import { FileText, RefreshCw, CheckCircle2, Clock, Users } from 'lucide-react';
import { formatMeetingDate, formatDuration } from '../../../lib/meeting-format';
import { apiReprocessMeeting } from '../../meetings/meetings-api';

export interface TranscriptSourceCardProps {
  meeting: MeetingItem;
  rawFilename?: string;
  sourceFormat?: string;
  onReprocessTriggered?: () => void;
}

export function TranscriptSourceCard({
  meeting,
  rawFilename,
  sourceFormat = 'TXT',
  onReprocessTriggered,
}: TranscriptSourceCardProps) {
  const [isReprocessing, setIsReprocessing] = React.useState(false);

  const turnsCount = meeting.transcriptTurns?.length || 0;
  const filename = rawFilename || 'Transcript filename unavailable';

  const handleReprocess = async () => {
    try {
      setIsReprocessing(true);
      await apiReprocessMeeting(meeting.id);
      toast.success('Reprocessing queued! Refreshing intelligence engine...');
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger reprocessing');
    } finally {
      setIsReprocessing(false);
      onReprocessTriggered?.();
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Source File Info */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
            <FileText className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Transcript Uploaded
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-bold text-amber-600 border-amber-500/30"
              >
                {sourceFormat.toUpperCase()} Source
              </Badge>
              {meeting.status === 'ready' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Ready
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-mono">
              {filename}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                {formatMeetingDate(meeting.startDate)}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground/70" />
                {turnsCount} conversational turns parsed
              </span>
              {meeting.durationSeconds > 0 && (
                <>
                  <span>•</span>
                  <span>
                    {formatDuration(meeting.durationSeconds)} recorded duration
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReprocess}
            disabled={isReprocessing}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isReprocessing ? 'animate-spin' : ''}`}
            />
            <span>{isReprocessing ? 'Re-queuing...' : 'Reprocess AI'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
