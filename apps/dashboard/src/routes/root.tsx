import { createRootRoute, Outlet, Link, useRouterState } from '@tanstack/react-router';
import { useTheme } from '../providers/theme-provider';
import { Button } from '@meetflow/ui';
import { Moon, Sun, Sparkles, LayoutGrid, Palette, Layers } from 'lucide-react';

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { theme, setTheme } = useTheme();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex h-11 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 select-none group">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs shadow-xs transition-transform group-hover:scale-105">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-xs tracking-tight">MeetFlow AI</span>
              <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-medium text-primary uppercase tracking-wider">
                Phase 01
              </span>
            </Link>

            <div className="h-3.5 w-[1px] bg-border mx-1" />

            {/* Navigation links */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  currentPath === '/'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Overview</span>
              </Link>
              <Link
                to="/design"
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  currentPath === '/design'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Design System</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-3 px-4 text-center text-[11px] text-muted-foreground">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" />
            <span>MeetFlow AI — Engineering Foundation</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Vite + React + TanStack Router + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
