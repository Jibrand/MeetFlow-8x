import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  ExternalLink,
  Loader2,
  Menu,
} from 'lucide-react';
import { Button, Badge, toast } from '@meetflow/ui';
import { queryDemoAssistant, AskCitation } from './demo-ask-adapter';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: AskCitation[];
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'What were the key decisions made?',
  'Which tasks are still open?',
  'What happened in the engineering review?',
  'Who owns the database migration?',
];

export interface AskMeetFlowViewProps {
  onOpenMobileNav?: () => void;
}

export function AskMeetFlowView({ onOpenMobileNav }: AskMeetFlowViewProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('meetflow-chat-messages');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Persist session messages
  React.useEffect(() => {
    try {
      sessionStorage.setItem('meetflow-chat-messages', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto scroll to latest message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await queryDemoAssistant(textToSend);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        citations: response.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      toast.error('Failed to query meeting assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    sessionStorage.removeItem('meetflow-chat-messages');
    toast.success('Conversation reset');
  };

  const isConversationActive = messages.length > 0;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Thinner Top Action Bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3 sm:px-6">
        <div className="flex items-center gap-2">
          {onOpenMobileNav && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onOpenMobileNav}
              className="h-7 w-7 text-muted-foreground md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-foreground">MeetFlow Intelligence</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
            Demo Mode
          </Badge>
        </div>

        {isConversationActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            title="Reset conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      {/* Main Conversation Container */}
      {!isConversationActive ? (
        /* Empty State: Centered Identity, Prompt Suggestions, & Centered Composer */
        <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-xl space-y-6 text-center">
            <div className="space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                What would you like to know about your meetings?
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Ask questions across past calls, decisions, action items, and technical reviews.
              </p>
            </div>

            {/* Composer Centered */}
            <div className="rounded-xl border border-border bg-card p-2 shadow-sm text-left focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <textarea
                ref={textareaRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about decisions, open deliverables, or discussion topics…"
                className="w-full resize-none bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <div className="flex items-center justify-between border-t border-border/50 px-2 pt-2">
                <span className="text-[10px] text-muted-foreground">
                  Press <kbd className="rounded border bg-muted px-1 font-mono text-[9px]">Enter</kbd> to ask
                </span>
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="h-7 gap-1.5 text-xs px-3 shadow-2xs"
                >
                  <span>Ask</span>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Suggested Question Pills */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Suggested questions:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-xs text-foreground/90 hover:border-primary hover:bg-secondary/50 transition-colors group"
                  >
                    <span className="line-clamp-1">{prompt}</span>
                    <Sparkles className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Conversation Mode: Scrollable messages + Bottom Composer */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 space-y-4 max-w-4xl w-full mx-auto"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary border border-border">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3.5 shadow-2xs space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs'
                      : 'bg-card border border-border text-foreground rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.text}
                  </div>

                  {/* Citations Box */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Matching Sources ({m.citations.length}):
                      </p>
                      <div className="space-y-1">
                        {m.citations.map((c, i) => (
                          <Link
                            key={i}
                            to="/meetings/$meetingId"
                            params={{ meetingId: c.meetingId }}
                            className="flex items-center justify-between gap-2 rounded-md bg-secondary/60 px-2 py-1 text-[11px] hover:bg-secondary text-foreground/90 transition-colors"
                          >
                            <span className="truncate font-medium">{c.meetingTitle}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] ${
                      m.sender === 'user' ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground border border-border">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground pl-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>MeetFlow is reviewing meeting archives…</span>
              </div>
            )}
          </div>

          {/* Bottom Fixed Composer */}
          <div className="border-t border-border bg-card p-3 sm:p-4 shrink-0">
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <span className="text-muted-foreground shrink-0 font-medium">Quick ask:</span>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-border bg-secondary/70 px-2.5 py-0.5 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-secondary whitespace-nowrap transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative rounded-xl border border-border bg-background p-1.5 shadow-2xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your meeting recordings… (Enter to send, Shift+Enter for new line)"
                  className="w-full resize-none bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />

                <div className="flex items-center justify-between border-t border-border/40 px-2 pt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    Press <kbd className="rounded border bg-muted px-1 font-mono text-[9px]">Enter</kbd> to send
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="h-7 gap-1.5 text-xs px-3 shadow-2xs"
                  >
                    <span>Ask</span>
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
