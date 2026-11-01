import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Video,
  CheckSquare,
  Calendar,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Moon,
  Sun,
  X,
  Compass,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  Avatar,
  Button,
} from '@meetflow/ui';
import { useTheme } from '../../providers/theme-provider';
import { cn } from '@meetflow/ui';

export interface NavItemConfig {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  { title: 'Meetings', path: '/', icon: Video },
  { title: 'Action Items', path: '/actions', icon: CheckSquare, badge: '3' },
  { title: 'Calendar', path: '/calendar', icon: Calendar },
  { title: 'Ask MeetFlow', path: '/ask', icon: Sparkles },
  { title: 'Settings', path: '/settings', icon: Settings },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme, setTheme } = useTheme();

  const isNavActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/' || currentPath.startsWith('/meetings');
    }
    return currentPath === path;
  };

  const navContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border select-none">
      {/* 1. Fixed Header Region (52px height) */}
      <div className="flex h-13 shrink-0 items-center justify-between px-3 border-b border-sidebar-border/60">
        <div
          className={cn(
            'flex items-center gap-2.5 overflow-hidden transition-all',
            collapsed ? 'w-full justify-center' : 'w-auto'
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold tracking-tight text-foreground">
                MeetFlow AI
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                Product Workspace
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Mobile Close Button */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Scrollable Middle Navigation Region */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-1">
        <div className={cn('px-2 py-1 text-label text-muted-foreground/70', collapsed && 'sr-only')}>
          {!collapsed && 'Navigation'}
        </div>

        <nav className="space-y-0.5" aria-label="Main Navigation">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path);

            const linkElement = (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={cn(
                  'group flex items-center rounded-md text-xs font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  collapsed
                    ? 'h-9 w-9 justify-center mx-auto'
                    : 'h-8 px-2.5 gap-2.5 w-full',
                  active
                    ? 'bg-secondary text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate text-left">{item.title}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path} delayDuration={100}>
                  <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    <div className="flex items-center gap-1.5">
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="text-[10px] opacity-80">({item.badge})</span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkElement;
          })}
        </nav>
      </div>

      {/* 3. Pinned Bottom Region (Account & Theme) */}
      <div className="shrink-0 p-2 border-t border-sidebar-border/60 bg-sidebar/50 space-y-1">
        {/* Design System Quick Link (Discrete Development Shortcut) */}
        {collapsed ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Link
                to="/design"
                onClick={onCloseMobile}
                className={cn(
                  'flex h-8 w-8 items-center justify-center mx-auto rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors',
                  currentPath === '/design' && 'bg-secondary text-foreground font-semibold'
                )}
              >
                <Compass className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <span>Design System Showcase (/design)</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            to="/design"
            onClick={onCloseMobile}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors',
              currentPath === '/design' && 'bg-secondary text-foreground font-semibold'
            )}
          >
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span className="flex-1 truncate">Design System</span>
            <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-mono text-muted-foreground">
              /design
            </span>
          </Link>
        )}

        {/* User Profile Bar */}
        <div
          className={cn(
            'flex items-center rounded-md p-1.5 transition-colors',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar size="sm" fallback="JD" alt="Jibran" className="shrink-0" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-medium text-foreground">Jibran</span>
                <span className="truncate text-[10px] text-muted-foreground">Staff Engineer</span>
              </div>
            )}
          </div>

          {!collapsed && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? (
                  <Sun className="h-3 w-3" />
                ) : (
                  <Moon className="h-3 w-3" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Sign out (stub)"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3 w-3" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      {/* Desktop Sidebar: Animated Width (216px expanded / 60px collapsed) */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 h-screen transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-[60px]' : 'w-[216px]'
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative flex w-[240px] max-w-[80vw] flex-1 flex-col bg-sidebar shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
