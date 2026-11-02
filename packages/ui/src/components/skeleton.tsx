import { cn } from '../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-skeleton=""
      className={cn(
        'animate-pulse motion-reduce:animate-none rounded-md bg-[hsl(var(--skeleton))]',
        className,
      )}
      {...props}
    />
  );
}
