import * as React from 'react';
import { HighlightData } from '../../../types/meeting';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  toast,
} from '@meetflow/ui';
import { Bookmark, Clock } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface HighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  initialTimestamp: number;
  initialHighlight?: HighlightData | null;
  onSave: (data: Omit<HighlightData, 'id'>) => void | Promise<void>;
  onUpdate?: (id: string, updates: Partial<HighlightData>) => void;
}

const CATEGORIES = [
  'Important',
  'Decision',
  'Action Item',
  'Question',
  'Customer Insight',
];

export function HighlightDialog({
  open,
  onOpenChange,
  meetingId,
  initialTimestamp,
  initialHighlight,
  onSave,
}: HighlightDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [label, setLabel] = React.useState('');
  const [tag, setTag] = React.useState('Important');
  const [timestamp, setTimestamp] = React.useState(0);
  const [timestampTouched, setTimestampTouched] = React.useState(false);
  const [quote, setQuote] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setError(null);
      setTimestampTouched(false);
      if (initialHighlight) {
        setLabel(initialHighlight.label);
        setTag(initialHighlight.tag);
        setTimestamp(initialHighlight.startTime);
        setQuote(initialHighlight.quote || '');
      } else {
        setLabel('');
        setTag('Important');
        setTimestamp(Math.round(initialTimestamp));
        setQuote('');
      }
    }
  }, [open, initialHighlight, initialTimestamp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Please enter a highlight label');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        hasTimestamp:
          initialHighlight?.hasTimestamp === false && !timestampTouched
            ? false
            : true,
        meetingId,
        label: label.trim(),
        tag,
        startTime: timestamp,
        quote: quote.trim() || undefined,
      });
      toast.success(initialHighlight ? 'Highlight updated' : 'Highlight saved');
      onOpenChange(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not save highlight.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <form aria-busy={saving} onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bookmark className="h-4 w-4" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                {initialHighlight
                  ? 'Edit Highlight'
                  : 'Create Meeting Highlight'}
              </DialogTitle>
            </div>
            <DialogDescription>
              Save the full content and timestamp for this meeting.
            </DialogDescription>
          </DialogHeader>

          <fieldset disabled={saving} className="space-y-3 text-xs">
            {/* Label input */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Highlight Title / Label
              </label>
              <Input
                aria-label="Highlight title"
                maxLength={255}
                placeholder="e.g. Approved sub-second scrubbing"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Category Tag
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTag(cat)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors select-none ${
                      tag === cat
                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Timestamp input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground">
                  Playback Timestamp
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {formatSecondsToTime(timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  type="number"
                  min={0}
                  value={timestamp}
                  aria-label="Highlight timestamp in seconds"
                  max={10000000}
                  onChange={(e) => {
                    setTimestampTouched(true);
                    setTimestamp(parseInt(e.target.value) || 0);
                  }}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Quote / Context note */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Notes / Quote (Optional)
              </label>
              <Textarea
                aria-label="Highlight content"
                maxLength={30000}
                placeholder="Add context or quotes from the speaker..."
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="text-xs min-h-[64px]"
              />
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={saving}
              type="submit"
              size="sm"
              className="h-8 text-xs"
            >
              {saving
                ? 'Saving…'
                : initialHighlight
                  ? 'Save Changes'
                  : 'Add Highlight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
