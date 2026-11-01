import * as React from 'react';
import { Sparkles, Search, MessageSquare, ArrowRight, CornerDownLeft } from 'lucide-react';
import { Input, Button, Card, CardHeader, CardTitle, CardContent, toast } from '@meetflow/ui';

const EXAMPLE_QUESTIONS = [
  'What were the key database indexing decisions made in the engineering review?',
  'Who was assigned to the API migrations and when are they due?',
  'What enterprise security questions did Acme Corp raise during customer discovery?',
  'Summarize the blockers mentioned in yesterday\'s retrospective.',
];

export function AskMeetFlowView() {
  const [query, setQuery] = React.useState('');

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    toast.info(
      'Semantic LLM Assistant connects in a future phase. Full RAG transcript retrieval will query your meetings.'
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          <span>Meeting Intelligence Assistant</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ask MeetFlow
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ask natural-language questions across all recorded calls, transcripts, summaries, and action items.
        </p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleAsk} className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ask anything about past discussions, decisions, or action items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 pl-10 pr-24 text-xs bg-card shadow-xs rounded-lg"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1.5 top-1.5 h-8 gap-1.5 text-xs font-medium"
        >
          <span>Ask AI</span>
          <CornerDownLeft className="h-3 w-3 opacity-60" />
        </Button>
      </form>

      {/* Suggested Questions */}
      <div className="max-w-2xl mx-auto space-y-3">
        <span className="text-label text-muted-foreground">Suggested Inquiries</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(q)}
              className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 select-none shadow-2xs"
            >
              <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-foreground/90 font-medium leading-relaxed">
                {q}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Architecture Context Card */}
      <Card className="max-w-2xl mx-auto border-dashed bg-muted/20">
        <CardHeader className="p-5">
          <CardTitle className="text-xs font-semibold text-foreground">
            How Ask MeetFlow Works (Roadmap)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            When connected to the live backend, Ask MeetFlow performs vector embedding lookups across timestamped transcripts, quotes exact timestamps, and routes you directly to the playback moment in the recording.
          </p>
          <div className="flex items-center gap-1.5 text-primary font-medium text-xs pt-1">
            <span>LLM orchestration planned for post-foundation phase</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
