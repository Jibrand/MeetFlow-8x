import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { Sidebar } from './sidebar';
import { TopHeader } from './top-header';
import { CommandPalette } from './command-palette';
import { useWorkspaceProcessingSync } from '../../features/meetings/use-meetings';

export interface AppShellProps {
  children: React.ReactNode;
}

const COLLAPSE_KEY = 'meetflow-sidebar-collapsed';

export function AppShell({ children }: AppShellProps) {
  useWorkspaceProcessingSync();
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
  const mainRef = React.useRef<HTMLElement | null>(null);

  // Global Scroll Reset: Reset main container scroll to top on pathname changes
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [currentPath]);

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
  const openMobile = React.useCallback(() => setMobileOpen(true), []);

  const isAskPage = currentPath === '/ask';

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
        {/* Hide global top header on standalone /ask page */}
        {!isAskPage && (
          <TopHeader
            currentPath={currentPath}
            onOpenMobileNav={openMobile}
            onOpenSearch={() => setPaletteOpen(true)}
          />
        )}
        <main
          ref={mainRef}
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
