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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'assistant',
    text: "Hello Jibran! I'm your MeetFlow AI assistant operating in **Demo Mode**. You can ask natural-language questions across all recorded meeting transcripts, summaries, decisions, and action items.",
    timestamp: 'Just now',
  },
];

const SUGGESTED_PROMPTS = [
  'What were the key decisions made?',
  'Which tasks are still open?',
  'What happened in the engineering review?',
  'Who owns the database migration?',
];

export function AskMeetFlowView() {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('meetflow-chat-messages');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MESSAGES;
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
    setMessages(INITIAL_MESSAGES);
    toast.success('Conversation reset');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-4xl flex-col p-4 sm:p-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                Ask MeetFlow
              </h1>
              <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Demo Mode</span>
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deterministic semantic intelligence querying your seeded meeting archives.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          title="Reset conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 scrollbar-thin"
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
                    Matching Citations ({m.citations.length}):
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
            <span>MeetFlow is reviewing meeting transcripts…</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts Pill Bar */}
      <div className="space-y-2 pt-2 border-t border-border shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-muted-foreground shrink-0 font-medium">Try asking:</span>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-secondary/60 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Composer Input Area */}
        <div className="relative rounded-xl border border-border bg-card p-1.5 shadow-xs focus-within:border-primary">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about decisions, action items, or past meeting discussions… (Enter to send, Shift+Enter for new line)"
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
  );
}
