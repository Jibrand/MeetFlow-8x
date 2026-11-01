import * as React from 'react';
import { HighlightData } from '../../../types/meeting';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  onSave: (data: Omit<HighlightData, 'id'>) => void;
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
  onUpdate,
}: HighlightDialogProps) {
  const [label, setLabel] = React.useState('');
  const [tag, setTag] = React.useState('Important');
  const [timestamp, setTimestamp] = React.useState(0);
  const [quote, setQuote] = React.useState('');

  React.useEffect(() => {
    if (open) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error('Please enter a highlight label');
      return;
    }

    if (initialHighlight && onUpdate) {
      onUpdate(initialHighlight.id, {
        label: label.trim(),
        tag,
        startTime: timestamp,
        quote: quote.trim() || undefined,
      });
      toast.success('Highlight updated');
    } else {
      onSave({
        meetingId,
        label: label.trim(),
        tag,
        startTime: timestamp,
        quote: quote.trim() || undefined,
      });
      toast.success('Highlight saved');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bookmark className="h-4 w-4" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                {initialHighlight ? 'Edit Highlight' : 'Create Meeting Highlight'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            {/* Label input */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">Highlight Title / Label</label>
              <Input
                placeholder="e.g. Approved sub-second scrubbing"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">Category Tag</label>
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
                <label className="font-medium text-foreground">Playback Timestamp</label>
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
                  onChange={(e) => setTimestamp(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Quote / Context note */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">Notes / Quote (Optional)</label>
              <Textarea
                placeholder="Add context or quotes from the speaker..."
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="text-xs min-h-[64px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs">
              {initialHighlight ? 'Save Changes' : 'Add Highlight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
