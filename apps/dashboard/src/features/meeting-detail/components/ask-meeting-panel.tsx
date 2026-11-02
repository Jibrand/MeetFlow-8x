import * as React from 'react';
import { MeetingItem } from '../../../types/meeting';
import { Input, Button, toast } from '@meetflow/ui';
import { queryAssistant } from '../../ask/ask-api';
import { Sparkles, Send, Bot, User, Play, Info } from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface AskMeetingPanelProps {
  meeting: MeetingItem;
  onSeek: (seconds: number) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: { quote: string; seconds?: number; speaker?: string }[];
}

export function AskMeetingPanel({ meeting, onSeek }: AskMeetingPanelProps) {
  const [query, setQuery] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Hello! I'm your MeetFlow AI assistant for "${meeting.title}". You can ask me about decisions, participant commitments, or key takeaways discussed during this call.`,
    },
  ]);

  const [isThinking, setIsThinking] = React.useState(false);
  const samplePrompts = [
    'What were the key decisions made?',
    'What did each participant commit to?',
    'What are the unresolved blockers or risks?',
  ];

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim() || isThinking) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: 'user', text: questionText }]);
    setQuery(''); setIsThinking(true);
    try {
      const result = await queryAssistant(questionText, meeting.id, messages.filter((message) => message.id !== 'msg-welcome').slice(-10).map((message) => ({ role: message.sender, content: message.text })));
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: 'assistant', text: result.answer, citations: result.citations.map((citation) => ({ quote: citation.quote ?? '', seconds: citation.timestampSeconds, speaker: citation.speaker })) }]);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to answer this question.'); }
    finally { setIsThinking(false); }
  };

  return (
    <div className="flex flex-col h-[560px] rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      {/* Notice Banner */}
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3.5 py-2 text-[11px] text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary shrink-0" />
        <span>
          Answers are generated from this meeting’s saved transcript, summary and action items.
        </span>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 text-xs ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`space-y-2 rounded-lg px-3 py-2 max-w-[85%] ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted/40 border border-border/60 text-foreground'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

              {/* Citations with clickable timestamps */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-1.5 border-t border-border/40 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Evidence Citations:
                  </span>
                  <div className="space-y-1">
                    {msg.citations.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={() => { if (c.seconds !== undefined) onSeek(c.seconds); }}
                        className="flex items-center justify-between gap-2 rounded bg-card/70 px-2 py-1 text-[11px] hover:bg-card cursor-pointer border border-border/50 text-foreground transition-colors"
                      >
                        <span className="truncate italic">"{c.quote}"</span>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-primary shrink-0 font-medium">
                          <Play className="h-2 w-2 fill-primary" />
                          <span>{c.seconds === undefined ? 'Source' : formatSecondsToTime(c.seconds)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
            <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Analyzing transcript evidence...</span>
          </div>
        )}
      </div>

      {/* Suggested Chips & Input Form */}
      <div className="p-3 border-t border-border/60 bg-muted/15 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(p)}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Ask anything about this meeting..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 text-xs bg-card"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isThinking}
            className="h-8 px-3 gap-1 text-xs shrink-0"
          >
            <Send className="h-3 w-3" />
            <span className="sr-only sm:not-sr-only">Ask</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
