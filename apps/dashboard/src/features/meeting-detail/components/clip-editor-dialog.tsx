import * as React from 'react';
import { MeetingClip } from '../../../types/meeting';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  toast,
} from '@meetflow/ui';
import { Scissors, Play, Trash2 } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface ClipEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  duration: number;
  currentTimestamp: number;
  clips: MeetingClip[];
  onSaveClip: (clip: Omit<MeetingClip, 'id' | 'createdAt'>) => void;
  onDeleteClip: (id: string) => void;
  onSeek: (seconds: number) => void;
  onPlayRange: (start: number, end: number) => void;
}

export function ClipEditorDialog({
  open,
  onOpenChange,
  meetingId,
  duration,
  currentTimestamp,
  clips,
  onSaveClip,
  onDeleteClip,
  onSeek,
  onPlayRange,
}: ClipEditorDialogProps) {
  const [title, setTitle] = React.useState('');
  const [startTime, setStartTime] = React.useState(0);
  const [endTime, setEndTime] = React.useState(15);

  React.useEffect(() => {
    if (open) {
      const start = Math.max(0, Math.floor(currentTimestamp));
      const end = Math.min(duration, start + 15);
      setStartTime(start);
      setEndTime(end);
      setTitle(`Highlight Clip (${formatSecondsToTime(start)} - ${formatSecondsToTime(end)})`);
    }
  }, [open, currentTimestamp, duration]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a clip title');
      return;
    }
    if (startTime >= endTime) {
      toast.error('End time must be greater than start time');
      return;
    }

    onSaveClip({
      meetingId,
      title: title.trim(),
      startTime,
      endTime,
    });
    toast.success('Clip selection saved');
    setTitle('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Scissors className="h-4 w-4" />
            </div>
            <DialogTitle className="text-sm font-semibold">Meeting Clips & Snippets</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* New Clip Form */}
          <form onSubmit={handleSave} className="rounded-lg border border-border/70 bg-card p-3.5 space-y-3">
            <h4 className="font-semibold text-foreground">Create New Clip</h4>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Clip Title</label>
              <Input
                placeholder="e.g. Database index decision"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">
                  Start ({formatSecondsToTime(startTime)})
                </label>
                <Input
                  type="number"
                  min={0}
                  max={duration}
                  value={startTime}
                  onChange={(e) => setStartTime(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">
                  End ({formatSecondsToTime(endTime)})
                </label>
                <Input
                  type="number"
                  min={startTime + 1}
                  max={duration}
                  value={endTime}
                  onChange={(e) => setEndTime(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPlayRange(startTime, endTime)}
                className="h-7 text-xs gap-1.5"
              >
                <Play className="h-3 w-3" />
                <span>Preview Range</span>
              </Button>

              <Button type="submit" size="sm" className="h-7 text-xs">
                Save Clip
              </Button>
            </div>
          </form>

          {/* Saved Clips List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Saved Clips ({clips.length})</h4>
            {clips.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{clip.title}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatSecondsToTime(clip.startTime)} - {formatSecondsToTime(clip.endTime)} (
                        {clip.endTime - clip.startTime}s)
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSeek(clip.startTime)}
                        className="h-7 px-2 text-[11px] gap-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Play</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteClip(clip.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No saved clips for this meeting yet.</p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
