import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      actionLabel,
      onAction,
      secondaryActionLabel,
      onSecondaryAction,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-6 text-center animate-in fade-in-50',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground mb-3 shadow-xs">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
            {description}
          </p>
        )}
        {(actionLabel || secondaryActionLabel || children) && (
          <div className="mt-4 flex items-center gap-2">
            {actionLabel && (
              <Button size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && (
              <Button size="sm" variant="outline" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
            {children}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
