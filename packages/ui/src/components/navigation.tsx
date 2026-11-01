import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const navItemVariants = cva(
  'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  {
    variants: {
      active: {
        true: 'bg-secondary text-foreground font-semibold shadow-xs',
        false: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      },
      compact: {
        true: 'justify-center px-2 py-1.5',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
      compact: false,
    },
  }
);

export interface NavItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navItemVariants> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ className, active, compact, icon, badge, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(navItemVariants({ active, compact, className }))}
        {...props}
      >
        {icon && <span className="h-4 w-4 shrink-0 transition-opacity">{icon}</span>}
        {!compact && <span className="flex-1 truncate text-left">{children}</span>}
        {!compact && badge && <span className="ml-auto shrink-0">{badge}</span>}
      </button>
    );
  }
);
NavItem.displayName = 'NavItem';

export const NavSection = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col space-y-0.5 py-1', className)}>
      {title && (
        <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          {title}
        </span>
      )}
      {children}
    </div>
  );
};
