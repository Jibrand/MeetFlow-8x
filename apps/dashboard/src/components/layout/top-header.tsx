import { Button } from '@meetflow/ui';
import { Menu, Search, ChevronRight } from 'lucide-react';
import { NotificationPopover } from './notification-popover';
import { getPageTitle } from './nav-config';

export interface TopHeaderProps {
  currentPath: string;
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
}

export function TopHeader({ currentPath, onOpenMobileNav, onOpenSearch }: TopHeaderProps) {
  const { section, detail } = getPageTitle(currentPath);
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3 sm:px-5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOpenMobileNav}
        className="h-8 w-8 text-muted-foreground md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className={detail ? 'truncate text-muted-foreground' : 'truncate font-semibold text-foreground'}>
          {section}
        </span>
        {detail && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-semibold text-foreground">{detail}</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden h-8 w-56 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex lg:w-72"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search meetings…</span>
          <kbd className="rounded border border-border bg-elevated px-1.5 font-mono text-[10px]">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSearch}
          className="h-8 w-8 text-muted-foreground sm:hidden"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <NotificationPopover />
      </div>
    </header>
  );
}
