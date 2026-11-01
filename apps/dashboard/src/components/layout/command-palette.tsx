import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Input,
  Badge,
} from '@meetflow/ui';
import {
  Search,
  Video,
  CheckSquare,
  Calendar,
  Sparkles,
  Settings,
  Compass,
  ArrowRight,
} from 'lucide-react';

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const navigate = useNavigate();

  // Reset query on open
  React.useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const navigationItems = [
    { label: 'My Meetings', path: '/', icon: Video },
    { label: 'Action Items', path: '/actions', icon: CheckSquare },
    { label: 'Calendar Schedule', path: '/calendar', icon: Calendar },
    { label: 'Ask MeetFlow AI', path: '/ask', icon: Sparkles },
    { label: 'Workspace Settings', path: '/settings', icon: Settings },
    { label: 'Design System Showcase', path: '/design', icon: Compass },
  ];

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMeetings = SEEDED_MEETINGS.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase()) ||
    m.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
    m.participants.some((p) => p.name.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate({ to: path });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-xl max-h-[80vh] flex flex-col gap-0 border-border shadow-2xl">
        <DialogTitle className="sr-only">Command Palette Navigation</DialogTitle>
        <DialogDescription className="sr-only">
          Quick search meetings and navigate pages with keyboard
        </DialogDescription>

        {/* Input Bar */}
        <div className="flex items-center border-b px-3 h-12 bg-card">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <Input
            autoFocus
            placeholder="Type a command or search meetings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-xs px-1 h-9 bg-transparent"
          />
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 max-h-[380px]">
          {/* Navigation Links */}
          {filteredNav.length > 0 && (
            <div className="space-y-1">
              <span className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Navigation
              </span>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-accent/60 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meeting Matches */}
          {filteredMeetings.length > 0 && (
            <div className="space-y-1">
              <span className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Meetings ({filteredMeetings.length})
              </span>
              <div className="space-y-0.5">
                {filteredMeetings.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(`/meetings/${m.id}`)}
                    className="w-full flex items-center justify-between rounded-md px-2.5 py-2 text-xs text-foreground hover:bg-accent/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Video className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium truncate">{m.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(m.durationSeconds / 60)}m
                      </span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0">
                        {m.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredMeetings.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or meetings found for "{query}".
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
