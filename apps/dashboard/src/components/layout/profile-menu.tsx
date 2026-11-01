import * as React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Button,
  toast,
  cn,
} from '@meetflow/ui';
import { ChevronsUpDown, Settings, LogOut } from 'lucide-react';
import { DEMO_USAGE } from '../../data/demo-usage';
import { ThemeToggleButton } from './theme-toggle-button';
import { authAdapter, AuthUser } from '../../features/auth/lib/auth-adapter';

export interface ProfileMenuProps {
  collapsed: boolean;
  onNavigate: () => void;
}

export function ProfileMenu({ collapsed, onNavigate }: ProfileMenuProps) {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<AuthUser | null>(() => authAdapter.getCurrentUser());

  React.useEffect(() => {
    return authAdapter.subscribe((u) => setUser(u));
  }, []);

  const displayName = user?.name || 'Workspace Member';
  const displayEmail = user?.email || 'member@meetflow.ai';
  const displayInitials = user?.initials ||
    displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'MF';
  const displayWorkspace = user?.workspace || 'My Workspace';

  const handleLogout = () => {
    authAdapter.logout();
    toast.success('Signed out of MeetFlow');
    onNavigate();
    navigate({ to: '/login' });
  };

  const usagePercent = Math.min(
    100,
    Math.round((DEMO_USAGE.hoursUsed / DEMO_USAGE.totalAllowanceHours) * 100)
  );

  return (
    <div className={cn('flex items-center', collapsed ? 'flex-col gap-1.5' : 'gap-1')}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open profile menu"
            className={cn(
              'flex min-w-0 flex-1 items-center rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-hover',
              collapsed ? 'justify-center' : 'gap-2'
            )}
          >
            <Avatar size="sm" fallback={displayInitials} alt={displayName} />
            {!collapsed && (
              <>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-foreground">{displayName}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{displayEmail}</span>
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align={collapsed ? 'start' : 'center'}
          sideOffset={8}
          collisionPadding={8}
          className="w-64"
        >
          <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2 font-normal">
            <Avatar size="default" fallback={displayInitials} alt={displayName} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-foreground">{displayName}</span>
              <span className="truncate text-[11px] text-muted-foreground">{displayEmail}</span>
              <span className="truncate text-[10px] text-primary font-medium mt-0.5">{displayWorkspace}</span>
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Compact Demo Usage Display */}
          <div className="px-2.5 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">{DEMO_USAGE.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {DEMO_USAGE.hoursUsed}h / {DEMO_USAGE.totalAllowanceHours}h
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="gap-2">
            <Link to="/settings" onClick={onNavigate}>
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              Workspace settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Inline Theme Switcher in Menu */}
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-muted-foreground">
            <span>Cycle theme</span>
            <ThemeToggleButton />
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick logout action in sidebar footer */}
      {!collapsed && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

