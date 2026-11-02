import * as React from 'react';
import { HighlightData, TranscriptTurnItem } from '../../../types/meeting';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@meetflow/ui';
import { Bookmark, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface HighlightsPanelProps {
  highlights: HighlightData[];
  onSeek: (seconds: number) => void;
  onOpenCreate: () => void;
  onEdit: (highlight: HighlightData) => void;
  onDelete: (id: string) => void | Promise<void>;
  turns?: TranscriptTurnItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function HighlightsPanel({
  highlights,
  onSeek,
  onOpenCreate,
  onEdit,
  onDelete,
  turns = [],
  loading,
  error,
  onRetry,
}: HighlightsPanelProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<HighlightData | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const selected = highlights.find((item) => item.id === selectedId);
  const timedAnchor =
    selected && selected.hasTimestamp !== false
      ? turns.findIndex(
          (turn) =>
            turn.startTime <= selected.startTime &&
            turn.endTime > selected.startTime,
        )
      : -1;
  const anchor =
    timedAnchor >= 0
      ? timedAnchor
      : selected?.quote
        ? turns.findIndex((turn) => turn.text.includes(selected.quote!))
        : -1;
  const context =
    anchor >= 0 ? turns.slice(Math.max(0, anchor - 1), anchor + 2) : [];
  const cancel = React.useRef<HTMLButtonElement>(null);
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
      {loading ? (
        <p
          role="status"
          className="rounded-lg border p-4 text-xs text-muted-foreground animate-pulse"
        >
          Loading highlights…
        </p>
      ) : error ? (
        <div role="alert" className="text-xs">
          <p>{error}</p>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : filteredHighlights.length > 0 ? (
        <div className="space-y-2">
          {filteredHighlights.map((hl) => (
            <div
              key={hl.id}
              onClick={() => setSelectedId(hl.id)}
              className="group flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-2.5 transition-all hover:border-primary/40 hover:bg-muted/30 cursor-pointer shadow-2xs select-none"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Bookmark className="h-3 w-3 text-primary shrink-0 fill-primary/20" />
                  <button
                    type="button"
                    aria-label={`Open highlight: ${hl.label}`}
                    className="text-left text-xs font-medium text-foreground truncate focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(hl.id);
                    }}
                  >
                    {hl.label}
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-mono font-medium text-primary">
                    {hl.hasTimestamp === false
                      ? 'No timestamp'
                      : formatSecondsToTime(hl.startTime)}
                  </span>
                  <div className="flex items-center opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
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
                        setDeleteError(null);
                        setDeleting(hl);
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
          No highlights saved yet. Click "Add Moment" or bookmark a transcript
          turn.
        </div>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.label}</DialogTitle>
            <DialogDescription>
              {selected?.tag} ·{' '}
              {selected?.hasTimestamp === false
                ? 'Timestamp unavailable'
                : selected
                  ? formatSecondsToTime(selected.startTime)
                  : ''}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {selected?.quote || 'No additional content was saved.'}
          </p>
          {context.length > 0 && (
            <section className="space-y-3 rounded-lg bg-muted/40 p-4">
              <h3 className="text-xs font-semibold">Transcript context</h3>
              {context.map((turn) => (
                <div key={turn.id} className="text-xs leading-relaxed">
                  <p className="font-medium text-muted-foreground">
                    {turn.speakerName} · {formatSecondsToTime(turn.startTime)}
                  </p>
                  <p className="whitespace-pre-wrap">{turn.text}</p>
                </div>
              ))}
            </section>
          )}
          <DialogFooter>
            {selected && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedId(null);
                    onEdit(selected);
                  }}
                >
                  Edit highlight
                </Button>
                {selected.hasTimestamp !== false && (
                  <Button
                    onClick={() => {
                      onSeek(selected.startTime);
                      setSelectedId(null);
                    }}
                  >
                    View in transcript
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent
          role="alertdialog"
          aria-busy={busy}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancel.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete highlight?</DialogTitle>
            <DialogDescription>
              Remove “{deleting?.label}” from this meeting and its shared page.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-xs text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              ref={cancel}
              variant="outline"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (!deleting) return;
                setBusy(true);
                setDeleteError(null);
                void Promise.resolve(onDelete(deleting.id))
                  .then(() => {
                    setDeleting(null);
                    setSelectedId(null);
                  })
                  .catch((error: Error) => setDeleteError(error.message))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? 'Deleting…' : 'Delete highlight'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
