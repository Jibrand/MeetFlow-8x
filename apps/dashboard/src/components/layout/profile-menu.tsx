import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Settings, ChevronsUpDown, LogOut, UserRound } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@meetflow/ui';
import { authAdapter } from '../../features/auth/lib/auth-adapter';

export function ProfileMenu({ collapsed, onNavigate }: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const [user, setUser] = React.useState(() => authAdapter.getCurrentUser());
  React.useEffect(() => authAdapter.subscribe(setUser), []);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Admin profile menu" className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {user?.initials || <UserRound className="h-4 w-4" />}
          </span>
          {!collapsed && <><span className="min-w-0 flex-1"><span className="block truncate font-medium">{user?.name || 'Admin'}</span><span className="text-[11px] text-muted-foreground">Single admin</span></span><ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="truncate">{user?.name || 'Admin'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/settings" onClick={onNavigate}><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
        <p className="px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">This local single-admin instance has no sign-in session to end.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
