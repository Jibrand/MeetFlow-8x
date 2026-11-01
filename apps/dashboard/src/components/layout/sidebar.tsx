import * as React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { PanelLeftClose, PanelLeftOpen, X, AudioLines } from 'lucide-react';
import { TooltipProvider, Button, cn } from '@meetflow/ui';
import { SidebarNav } from './sidebar-nav';
import { ProfileMenu } from './profile-menu';
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from './nav-config';
import { useActionItems } from '../../features/actions/use-action-items';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const actionItems = useActionItems();
  const openCount = actionItems.filter((i) => !i.completed).length;

  // Close mobile drawer with Escape
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseMobile();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  const renderContent = (isCollapsed: boolean, isMobile: boolean) => (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
        )}
      >
        <Link
          to="/overview"
          onClick={onCloseMobile}
          className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="MeetFlow AI home"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <AudioLines className="h-4 w-4" />
          </span>
          {!isCollapsed && (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[13px] font-semibold tracking-tight">MeetFlow AI</span>
              <span className="truncate text-[10px] text-muted-foreground">Product Workspace</span>
            </span>
          )}
        </Link>

        {isMobile ? (
          <Button variant="ghost" size="icon-sm" onClick={onCloseMobile} aria-label="Close menu" className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          !isCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )
        )}
      </div>

      {/* Navigation (scrolls independently) */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-2">
        <SidebarNav
          label="Primary"
          items={PRIMARY_NAV_ITEMS}
          currentPath={currentPath}
          collapsed={isCollapsed}
          onNavigate={onCloseMobile}
          badges={{ '/actions': openCount || undefined }}
        />
        <div className="mt-auto">
          <SidebarNav
            label="Secondary"
            items={SECONDARY_NAV_ITEMS}
            currentPath={currentPath}
            collapsed={isCollapsed}
            onNavigate={onCloseMobile}
          />
          {!isMobile && isCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="mx-auto mt-0.5 flex h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Pinned profile */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <ProfileMenu collapsed={isCollapsed} onNavigate={onCloseMobile} />
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'hidden h-full shrink-0 transition-[width] duration-200 ease-out md:block',
          collapsed ? 'w-[60px]' : 'w-[220px]'
        )}
      >
        {renderContent(collapsed, false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[260px] max-w-[85vw] shadow-2xl">
            {renderContent(false, true)}
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}
