import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Sidebar } from './sidebar';
import { TopHeader } from './top-header';
import { CommandPalette } from './command-palette';

export interface AppShellProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'meetflow-sidebar-collapsed';

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || 'false');
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  const handleToggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const closeMobile = React.useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopHeader
          currentPath={currentPath}
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenSearch={() => setPaletteOpen(true)}
        />
        <main id="main-content" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
