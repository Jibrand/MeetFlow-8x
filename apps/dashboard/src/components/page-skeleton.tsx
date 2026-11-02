import { Skeleton } from '@meetflow/ui';

export function PageSkeleton({
  kind,
}: {
  kind: 'meetings' | 'calendar' | 'detail' | 'actions' | 'overview';
}) {
  const row = (index: number) => (
    <div
      key={index}
      className="flex items-center gap-3 rounded-lg border bg-card p-4"
    >
      <Skeleton className="h-5 w-5 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
  const labels = {
    meetings: 'Loading meetings',
    calendar: 'Loading calendar',
    detail: 'Loading meeting details',
    actions: 'Loading action items',
    overview: 'Loading overview',
  };
  return (
    <div
      role="status"
      aria-label={labels[kind]}
      aria-live="polite"
      className="space-y-5"
    >
      <span className="sr-only">{labels[kind]}…</span>
      {kind === 'meetings' && (
        <>
          <div className="flex justify-between gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {kind === 'calendar' && (
        <>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-7 w-20" />
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-4 w-10 mx-auto" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, index) => (
                <Skeleton key={index} className="h-16 sm:h-20" />
              ))}
            </div>
          </div>
          <Skeleton className="h-5 w-44" />
          {[1, 2].map(row)}
        </>
      )}
      {kind === 'detail' && (
        <>
          <Skeleton className="h-4 w-28" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <Skeleton className="h-32 rounded-xl" />
              <div className="rounded-xl border bg-card p-5 space-y-5">
                <div className="flex gap-3">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-24" />
                </div>
                {[1, 2, 3].map((index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3 lg:col-span-4">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3].map(row)}
              <Skeleton className="h-28 rounded-lg" />
            </div>
          </div>
        </>
      )}
      {kind === 'actions' && (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(row)}</div>
      )}
      {kind === 'overview' && (
        <>
          <Skeleton className="h-7 w-52" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="rounded-lg border bg-card p-4 space-y-4"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">{[1, 2, 3].map(row)}</div>
            <div className="space-y-3">{[1, 2, 3].map(row)}</div>
          </div>
        </>
      )}
    </div>
  );
}
