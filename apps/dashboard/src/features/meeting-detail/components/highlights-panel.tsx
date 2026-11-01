import * as React from 'react';
import { HighlightData } from '../../../types/meeting';
import { Button } from '@meetflow/ui';
import { Bookmark, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface HighlightsPanelProps {
  highlights: HighlightData[];
  onSeek: (seconds: number) => void;
  onOpenCreate: () => void;
  onEdit: (highlight: HighlightData) => void;
  onDelete: (id: string) => void;
}

export function HighlightsPanel({
  highlights,
  onSeek,
  onOpenCreate,
  onEdit,
  onDelete,
}: HighlightsPanelProps) {
  const [activeTag, setActiveTag] = React.useState<string>('all');

  const availableTags = React.useMemo(() => {
    const set = new Set<string>();
    highlights.forEach((h) => set.add(h.tag));
    return Array.from(set);
  }, [highlights]);

  const filteredHighlights = React.useMemo(() => {
    if (activeTag === 'all') return highlights;
    return highlights.filter((h) => h.tag === activeTag);
  }, [highlights, activeTag]);

  return (
    <div className="space-y-3">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          <h4 className="text-xs font-semibold text-foreground">
            Highlights ({highlights.length})
          </h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenCreate}
          className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          <span>Add Moment</span>
        </Button>
      </div>

      {/* Category Filter Pills if tags exist */}
      {availableTags.length > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTag('all')}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors select-none ${
              activeTag === 'all'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors select-none ${
                activeTag === tag
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Highlights List */}
      {filteredHighlights.length > 0 ? (
        <div className="space-y-2">
          {filteredHighlights.map((hl) => (
            <div
              key={hl.id}
              onClick={() => onSeek(hl.startTime)}
              className="group flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-2.5 transition-all hover:border-primary/40 hover:bg-muted/30 cursor-pointer shadow-2xs select-none"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Bookmark className="h-3 w-3 text-primary shrink-0 fill-primary/20" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {hl.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-mono font-medium text-primary">
                    {formatSecondsToTime(hl.startTime)}
                  </span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(hl);
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      title="Edit highlight"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(hl.id);
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      title="Delete highlight"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {hl.quote && (
                <p className="text-[11px] text-muted-foreground italic line-clamp-2 pl-5">
                  "{hl.quote}"
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
          No highlights saved yet. Click "Add Moment" or bookmark a transcript turn.
        </div>
      )}
    </div>
  );
}
