import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full select-none bg-muted font-medium items-center justify-center text-foreground ring-1 ring-border/50',
  {
    variants: {
      size: {
        xs: 'h-5 w-5 text-[9px]',
        sm: 'h-6 w-6 text-[10px]',
        default: 'h-8 w-8 text-xs',
        lg: 'h-10 w-10 text-sm',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, children, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            onError={() => setHasError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-secondary font-medium uppercase tracking-wider text-secondary-foreground">
            {fallback || (alt ? alt.slice(0, 2) : children || 'U')}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';
