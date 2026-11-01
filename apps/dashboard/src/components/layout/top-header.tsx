import { Button } from '@meetflow/ui';
import { Menu, ChevronRight } from 'lucide-react';
import { getPageTitle } from './nav-config';

export interface TopHeaderProps {
  currentPath: string;
  onOpenMobileNav: () => void;
  onOpenSearch?: () => void;
}

export function TopHeader({ currentPath, onOpenMobileNav }: TopHeaderProps) {
  const { section, detail } = getPageTitle(currentPath);

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-3 sm:px-5">
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileNav}
          className="h-7 w-7 text-muted-foreground md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs sm:text-[13px]">
          <span className={detail ? 'truncate text-muted-foreground' : 'truncate font-semibold text-foreground'}>
            {section}
          </span>
          {detail && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate font-semibold text-foreground">{detail}</span>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
