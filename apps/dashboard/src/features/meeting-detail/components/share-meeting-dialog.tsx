import * as React from 'react';
import { MeetingItem } from '../../../types/meeting';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Checkbox,
  toast,
} from '@meetflow/ui';
import { Share2, Copy, Check, Lock } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface ShareMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: MeetingItem;
  currentTimestamp: number;
}

export function ShareMeetingDialog({
  open,
  onOpenChange,
  meeting,
  currentTimestamp,
}: ShareMeetingDialogProps) {
  const [includeTimestamp, setIncludeTimestamp] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const roundedTs = Math.round(currentTimestamp);

  const shareUrl = React.useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meetflow.ai';
    let url = `${origin}/meetings/${meeting.id}`;
    if (includeTimestamp && roundedTs > 0) {
      url += `?t=${roundedTs}`;
    }
    return url;
  }, [meeting.id, includeTimestamp, roundedTs]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Workspace link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <DialogTitle className="text-sm font-semibold">Share Meeting</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* Workspace Privacy Notice */}
          <div className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Workspace Member Access</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Workspace members can open this link after signing in to view the recording, transcript, and AI summary.
            </p>
          </div>

          {/* Link box */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Meeting Link</label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="h-8 text-xs font-mono bg-card"
                onFocus={(e) => e.target.select()}
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs gap-1.5 shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          {/* Timestamp checkbox */}
          {roundedTs > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="include-timestamp"
                checked={includeTimestamp}
                onCheckedChange={(val) => setIncludeTimestamp(Boolean(val))}
              />
              <label
                htmlFor="include-timestamp"
                className="text-xs text-foreground cursor-pointer select-none"
              >
                Start playback at current time ({formatSecondsToTime(roundedTs)})
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
