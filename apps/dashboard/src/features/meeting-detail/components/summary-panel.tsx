import { SummaryTemplateContent } from '../../../types/meeting';
import { EvidenceLink } from './evidence-link';
import { Card, CardHeader, CardTitle, CardContent, Button, toast } from '@meetflow/ui';
import { Sparkles, Copy } from 'lucide-react';

export interface SummaryPanelProps {
  template: SummaryTemplateContent;
  onSeek: (seconds: number) => void;
}

export function SummaryPanel({ template, onSeek }: SummaryPanelProps) {
  const handleCopySection = (title: string, items: { text: string }[]) => {
    const text = `${title}\n${items.map((i) => `• ${i.text}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${title}" section`);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-200">
      {/* Template Header Card */}
      <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">{template.label}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{template.description}</p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-3.5">
        {template.sections.map((section, idx) => (
          <Card key={idx} className="border border-border/70 bg-card/80 shadow-2xs">
            <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopySection(section.title, section.items)}
                className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                title="Copy section to clipboard"
              >
                <Copy className="h-3 w-3" />
                <span className="sr-only sm:not-sr-only">Copy</span>
              </Button>
            </CardHeader>
            <CardContent className="p-3.5 pt-2 space-y-2.5">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start justify-between gap-3 text-xs leading-relaxed group">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-primary font-bold mt-0.5 select-none">•</span>
                    <span className="text-foreground/90 font-normal">
                      {item.speakerName && (
                        <span className="font-semibold text-foreground mr-1.5">
                          {item.speakerName}:
                        </span>
                      )}
                      {item.text}
                    </span>
                  </div>

                  {item.timestampSeconds !== undefined && (
                    <div className="shrink-0 pt-0.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      <EvidenceLink seconds={item.timestampSeconds} onSeek={onSeek} />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
