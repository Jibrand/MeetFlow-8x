import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Sidebar } from './sidebar';
import { Button } from '@meetflow/ui';
import { Menu, Search, Command } from 'lucide-react';

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('meetflow-sidebar-collapsed');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('meetflow-sidebar-collapsed', JSON.stringify(next));
      } catch {
        // Ignore localStorage error
      }
      return next;
    });
  };

  // Compute page title based on current path
  const getPageTitle = (path: string) => {
    if (path === '/') return 'Meetings';
    if (path.startsWith('/meetings')) return 'Meetings';
    if (path === '/actions') return 'Action Items';
    if (path === '/calendar') return 'Calendar';
    if (path === '/ask') return 'Ask MeetFlow';
    if (path === '/settings') return 'Settings';
    if (path === '/design') return 'Design System Showcase';
    return 'Workspace';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* 1. Collapsible Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar (52px) */}
        <header className="flex h-13 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-xs select-none">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen(true)}
              className="flex md:hidden h-8 w-8 text-muted-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumb / Section Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-foreground">
                {getPageTitle(currentPath)}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Phase 02
              </span>
            </div>
          </div>

          {/* Quick Search / Command Palette Stub */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground shadow-2xs"
              title="Command Palette (Shortcut)"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search meetings or ask AI...</span>
              <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium opacity-80">
                <Command className="h-2.5 w-2.5" /> K
              </kbd>
            </button>

            {/* Backend health status pill */}
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors"
              title="API Server is Operational"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Live</span>
            </a>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
