import { Badge } from '@meetflow/ui';

export function ColorShowcase() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">2. Semantic Surface & Accent Tokens</h2>
          <p className="text-xs text-muted-foreground">Theme-reactive neutrals with single restrained accent.</p>
        </div>
        <Badge variant="outline">HSL Reactive</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
        <div className="p-3 rounded-md border bg-background text-foreground space-y-1 shadow-2xs">
          <div className="font-semibold">Canvas</div>
          <div className="text-[10px] text-muted-foreground">bg-background</div>
        </div>
        <div className="p-3 rounded-md border bg-card text-card-foreground space-y-1 shadow-2xs">
          <div className="font-semibold">Card Surface</div>
          <div className="text-[10px] text-muted-foreground">bg-card</div>
        </div>
        <div className="p-3 rounded-md bg-primary text-primary-foreground space-y-1 shadow-2xs">
          <div className="font-semibold">Accent Blue</div>
          <div className="text-[10px] opacity-80">bg-primary</div>
        </div>
        <div className="p-3 rounded-md bg-secondary text-secondary-foreground space-y-1 shadow-2xs">
          <div className="font-semibold">Secondary</div>
          <div className="text-[10px] text-muted-foreground">bg-secondary</div>
        </div>
        <div className="p-3 rounded-md bg-muted text-muted-foreground space-y-1 shadow-2xs">
          <div className="font-semibold">Muted</div>
          <div className="text-[10px] opacity-80">bg-muted</div>
        </div>
        <div className="p-3 rounded-md bg-destructive text-destructive-foreground space-y-1 shadow-2xs">
          <div className="font-semibold">Destructive</div>
          <div className="text-[10px] opacity-80">bg-destructive</div>
        </div>
      </div>
    </section>
  );
}
