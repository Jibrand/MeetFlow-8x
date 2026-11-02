import * as React from 'react';
import { ActionItemData } from '../../../types/meeting';
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
import { CheckSquare, Calendar, Clock, User } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface ActionItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
  initialTimestamp?: number;
  initialItem?: ActionItemData | null;
  onSave: (item: Omit<ActionItemData, 'id'>) => void | Promise<void>;
  onUpdate?: (
    id: string,
    updates: Partial<ActionItemData>,
  ) => void | Promise<void>;
}

export function ActionItemDialog({
  open,
  onOpenChange,
  meetingId,
  meetingTitle,
  initialTimestamp = 0,
  initialItem,
  onSave,
  onUpdate,
}: ActionItemDialogProps) {
  const [title, setTitle] = React.useState('');
  const [assigneeName, setAssigneeName] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high'>(
    'medium',
  );
  const [timestampSeconds, setTimestampSeconds] = React.useState<number>(0);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (initialItem) {
        setTitle(initialItem.title);
        setAssigneeName(initialItem.assigneeName || '');
        setDueDate(initialItem.dueDate?.slice(0, 10) || '');
        setPriority(initialItem.priority);
        setTimestampSeconds(initialItem.timestampSeconds || 0);
      } else {
        setTitle('');
        setAssigneeName('');
        setDueDate('');
        setPriority('medium');
        setTimestampSeconds(Math.round(initialTimestamp));
      }
    }
  }, [open, initialItem, initialTimestamp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      toast.error('Please enter an action item description');
      return;
    }

    setSaving(true);
    try {
      if (initialItem && onUpdate) {
        await onUpdate(initialItem.id, {
          title: title.trim(),
          assigneeName: assigneeName.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
          timestampSeconds,
        });
        toast.success('Action item updated');
      } else {
        await onSave({
          meetingId,
          meetingTitle,
          title: title.trim(),
          assigneeName: assigneeName.trim() || undefined,
          dueDate: dueDate || undefined,
          priority,
          completed: false,
          timestampSeconds,
        });
        toast.success(
          initialItem ? 'Action item updated' : 'Action item created',
        );
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to save action item.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <CheckSquare className="h-4 w-4" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                {initialItem ? 'Edit Action Item' : 'New Action Item'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            {/* Description */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">
                Task Description
              </label>
              <Input
                placeholder="e.g. Verify database indexing in staging"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="font-medium text-foreground">Assignee</label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="e.g. Sarah Connor"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>

            {/* Priority & Due Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as 'low' | 'medium' | 'high')
                  }
                  className="h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Due Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Linked Timestamp */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground">
                  Source Timestamp
                </label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {formatSecondsToTime(timestampSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  type="number"
                  min={0}
                  value={timestampSeconds}
                  onChange={(e) =>
                    setTimestampSeconds(parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-xs font-mono"
                />
              </div>
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
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="h-8 text-xs"
            >
              {initialItem ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
