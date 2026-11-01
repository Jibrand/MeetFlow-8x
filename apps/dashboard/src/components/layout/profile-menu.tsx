import { Link } from '@tanstack/react-router';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  cn,
} from '@meetflow/ui';
import { ChevronsUpDown, Settings, Gauge, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../providers/theme-provider';

export const DEMO_USER = {
  name: 'Jibran',
  email: 'jibran@meetflow.ai',
  initials: 'JI',
  workspace: 'MeetFlow Demo Workspace',
};

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export interface ProfileMenuProps {
  collapsed: boolean;
  onNavigate: () => void;
}

export function ProfileMenu({ collapsed, onNavigate }: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className={cn(
            'flex w-full items-center rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-hover',
            collapsed ? 'justify-center' : 'gap-2'
          )}
        >
          <Avatar size="sm" fallback={DEMO_USER.initials} alt={DEMO_USER.name} />
          {!collapsed && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium text-foreground">{DEMO_USER.name}</span>
                <span className="truncate text-[10px] text-muted-foreground">{DEMO_USER.email}</span>
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
        className="w-60"
      >
        <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-2 font-normal">
          <Avatar size="default" fallback={DEMO_USER.initials} alt={DEMO_USER.name} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold text-foreground">{DEMO_USER.name}</span>
            <span className="truncate text-[11px] text-muted-foreground">{DEMO_USER.email}</span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              Credits & usage
            </span>
            <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">
              Demo
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Billing isn't connected in this workspace, so no balance is tracked.
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="gap-2">
          <Link to="/settings" onClick={onNavigate}>
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            Workspace settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
