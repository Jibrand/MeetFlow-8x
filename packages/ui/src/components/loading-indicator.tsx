import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const loadingIndicatorVariants = cva('animate-spin text-muted-foreground', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      default: 'h-5 w-5',
      lg: 'h-7 w-7',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface LoadingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingIndicatorVariants> {
  label?: string;
  centered?: boolean;
}

export const LoadingIndicator = React.forwardRef<HTMLDivElement, LoadingIndicatorProps>(
  ({ className, size, label, centered = false, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-2 text-xs text-muted-foreground',
          centered && 'flex justify-center p-6 w-full',
          className
        )}
        {...props}
      >
        <Loader2 className={cn(loadingIndicatorVariants({ size }))} />
        {label && <span className="font-medium">{label}</span>}
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
    );

    return content;
  }
);
LoadingIndicator.displayName = 'LoadingIndicator';
