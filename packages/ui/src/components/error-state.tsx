import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title = 'Failed to load content',
      message = 'An unexpected error occurred while communicating with the server.',
      onRetry,
      compact = false,
      ...props
    },
    ref
  ) => {
    if (compact) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive',
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">{message}</span>
          </div>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
            >
              Retry
            </Button>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center shadow-xs',
          className
        )}
        {...props}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2.5">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">{message}</p>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="mt-4 gap-1.5 h-8 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        )}
      </div>
    );
  }
);
ErrorState.displayName = 'ErrorState';
