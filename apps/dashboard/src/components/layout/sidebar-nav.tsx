import { Link } from '@tanstack/react-router';
import { Tooltip, TooltipContent, TooltipTrigger, cn } from '@meetflow/ui';
import { NavItemConfig, isNavItemActive } from './nav-config';

export interface SidebarNavProps {
  items: NavItemConfig[];
  currentPath: string;
  collapsed: boolean;
  onNavigate: () => void;
  badges?: Record<string, number | undefined>;
  label: string;
}

export function SidebarNav({
  items,
  currentPath,
  collapsed,
  onNavigate,
  badges = {},
  label,
}: SidebarNavProps) {
  return (
    <nav className="space-y-0.5" aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(item, currentPath);
        const badge = badges[item.path];

        const link = (
          <Link
            to={item.path}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            aria-label={collapsed ? item.title : undefined}
            className={cn(
              'group relative flex items-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              collapsed ? 'mx-auto h-9 w-9 justify-center' : 'h-8 w-full gap-2.5 px-2.5',
              active
                ? 'bg-sidebar-active text-foreground'
                : 'text-muted-foreground hover:bg-sidebar-hover hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
            {!collapsed && badge ? (
              <span className="ml-auto rounded-full bg-elevated px-1.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {badge}
              </span>
            ) : null}
            {collapsed && badge ? (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            ) : null}
          </Link>
        );

        if (!collapsed) return <div key={item.path}>{link}</div>;

        return (
          <Tooltip key={item.path} delayDuration={100}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {item.title}
              {badge ? ` · ${badge}` : ''}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
