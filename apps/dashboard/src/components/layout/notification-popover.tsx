import * as React from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  cn,
} from '@meetflow/ui';
import { Bell, CheckCheck, Inbox } from 'lucide-react';

interface DemoNotification {
  id: string;
  title: string;
  body: string;
  time: string;
}

/** Seeded demo notifications — not delivered by any backend. */
const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'n1',
    title: 'Summary ready',
    body: 'Engineering Architecture: Neon Serverless & Event Pipelines',
    time: 'Nov 1',
  },
  {
    id: 'n2',
    title: 'Action item assigned to you',
    body: 'Benchmark client-side transcript seek latency under 100ms',
    time: 'Nov 1',
  },
  {
    id: 'n3',
    title: 'Processing failed',
    body: 'Ad-hoc Standup: Corrupted Audio Stream',
    time: 'Oct 27',
  },
];

const STORAGE_KEY = 'meetflow-notifications-read';

function loadRead(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function NotificationPopover() {
  const [readIds, setReadIds] = React.useState<string[]>(loadRead);
  const [dismissed, setDismissed] = React.useState(false);

  const persist = (ids: string[]) => {
    setReadIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const items = dismissed ? [] : DEMO_NOTIFICATIONS;
  const unread = items.filter((n) => !readIds.includes(n.id)).length;

  const toggleRead = (id: string) =>
    persist(readIds.includes(id) ? readIds.filter((r) => r !== id) : [...readIds, id]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={8} className="w-[min(340px,calc(100vw-16px))] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Notifications</span>
            <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">Demo data</span>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => persist(items.map((n) => n.id))}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={unread === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs font-medium">You're all caught up</p>
            <p className="text-[11px] text-muted-foreground">New notifications will appear here.</p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => toggleRead(n.id)}
                    className="flex w-full gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    aria-label={`${n.title}. ${isRead ? 'Mark as unread' : 'Mark as read'}`}
                  >
                    <span
                      className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', isRead ? 'bg-transparent' : 'bg-primary')}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-xs', isRead ? 'text-muted-foreground' : 'font-medium text-foreground')}>
                        {n.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">{n.body}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && (
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
