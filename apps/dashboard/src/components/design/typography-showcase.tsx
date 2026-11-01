export function TypographyShowcase() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">1. Typography Scale (100% Zoom)</h2>
        <p className="text-xs text-muted-foreground">Calibrated for Linear-density productivity software.</p>
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="text-display">Display 28px</span>
          <span className="text-[10px] text-muted-foreground font-mono">.text-display (28/34)</span>
        </div>
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="text-h1">Heading 1 — 22px</span>
          <span className="text-[10px] text-muted-foreground font-mono">.text-h1 (22/28)</span>
        </div>
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="text-h2">Heading 2 — 18px</span>
          <span className="text-[10px] text-muted-foreground font-mono">.text-h2 (18/24)</span>
        </div>
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="text-h3">Heading 3 — 15px</span>
          <span className="text-[10px] text-muted-foreground font-mono">.text-h3 (15/22)</span>
        </div>
        <div className="flex items-baseline justify-between border-b pb-2">
          <span className="text-body">Body default — 13px readable text across transcripts and summaries</span>
          <span className="text-[10px] text-muted-foreground font-mono">.text-body (13/20)</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-label text-muted-foreground">Section Label</span>
          <span className="text-[10px] text-muted-foreground font-mono">.text-label (10px uppercase)</span>
        </div>
      </div>
    </section>
  );
}
