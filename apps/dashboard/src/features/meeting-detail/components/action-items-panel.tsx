import { ActionItemData } from '../../../types/meeting';
import { Button, Checkbox, Badge, SpeakerAvatar } from '@meetflow/ui';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Loader2,
} from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface ActionItemsPanelProps {
  items: ActionItemData[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onSeek: (seconds: number) => void;
  onOpenCreate: () => void;
  onEdit: (item: ActionItemData) => void;
  onDelete: (id: string) => void;
  pendingIds?: ReadonlySet<string>;
}

export function ActionItemsPanel({
  items,
  onToggleComplete,
  onSeek,
  onOpenCreate,
  onEdit,
  onDelete,
  pendingIds,
}: ActionItemsPanelProps) {
  const openCount = items.filter((i) => !i.completed).length;

  return (
    <section className="space-y-3 rounded-xl border border-amber-200/50 bg-amber-50/30 p-3 shadow-[0_3px_14px_-8px_rgba(234,179,8,0.25)] dark:border-amber-200/10 dark:bg-amber-100/[0.025]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">
            Action Items ({openCount} open)
          </h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenCreate}
          className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          <span>New Task</span>
        </Button>
      </div>

      {/* List */}
      {items.length > 0 ? (
        <div role="region" aria-label="Action items" tabIndex={0} className="max-h-[min(26rem,55vh)] space-y-2 overflow-y-auto overscroll-contain scroll-smooth pr-1 motion-reduce:scroll-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group flex items-start justify-between gap-2.5 rounded-lg border border-border/60 bg-card p-2.5 transition-colors hover:border-border hover:bg-muted/20 select-none shadow-2xs ${
                item.completed ? 'opacity-65 bg-muted/20' : ''
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0 pt-0.5">
                <Checkbox
                  checked={item.completed}
                  disabled={pendingIds?.has(item.id)}
                  aria-label={`Complete ${item.title}`}
                  aria-busy={pendingIds?.has(item.id)}
                  onCheckedChange={(val) =>
                    onToggleComplete(item.id, Boolean(val))
                  }
                  className="h-4 w-4 shrink-0 transition-transform active:scale-90"
                />
                {pendingIds?.has(item.id) && (
                  <span role="status" aria-label="Saving task">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </span>
                )}
                <div className="space-y-1 min-w-0">
                  <p
                    className={`text-xs font-medium leading-snug transition-all ${
                      item.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {item.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    {item.assigneeName && (
                      <div className="flex items-center gap-1">
                        <SpeakerAvatar name={item.assigneeName} size="xs" />
                        <span className="font-medium">{item.assigneeName}</span>
                      </div>
                    )}

                    {item.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5 opacity-70" />
                        <span>{item.dueDate}</span>
                      </div>
                    )}

                    <Badge
                      variant={
                        item.priority === 'high'
                          ? 'destructive'
                          : item.priority === 'medium'
                            ? 'warning'
                            : 'secondary'
                      }
                      className="text-[9px] uppercase px-1 py-0 font-semibold"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timestamp & Actions */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                {item.timestampSeconds !== undefined && (
                  <button
                    type="button"
                    onClick={() => onSeek(item.timestampSeconds!)}
                    className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-mono font-medium text-primary hover:bg-primary/20 transition-colors"
                    title="Seek to timestamp"
                  >
                    {formatSecondsToTime(item.timestampSeconds)}
                  </button>
                )}

                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    title="Edit task"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    title="Delete task"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
          No action items recorded for this meeting. Click "New Task" to create
          one.
        </div>
      )}
    </section>
  );
}
