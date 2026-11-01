import { MeetingItem, ActionItemData } from '../../types/meeting';

/** Meetings per day for the 7 days ending today (local time). */
export function MeetingsPerDayChart({ meetings, now = new Date() }: { meetings: MeetingItem[]; now?: Date }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const counts = days.map((d) => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    return meetings.filter((m) => {
      const t = new Date(m.startDate).getTime();
      return m.status !== 'scheduled' && t >= d.getTime() && t < next.getTime();
    }).length;
  });
  const max = Math.max(1, ...counts);

  return (
    <div>
      <div className="flex h-28 items-end gap-2" role="img" aria-label={`Meetings per day: ${counts.join(', ')}`}>
        {counts.map((c, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">{c || ''}</span>
            <div
              className={c ? 'w-full rounded-sm bg-primary/80' : 'w-full rounded-sm bg-elevated'}
              style={{ height: c ? `${(c / max) * 80}%` : '3px' }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {days.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
            {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Donut showing completed vs open vs overdue action items. */
export function CompletionDonut({
  items,
  overdueCount,
}: {
  items: ActionItemData[];
  overdueCount: number;
}) {
  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const open = total - done - overdueCount;
  const r = 30;
  const C = 2 * Math.PI * r;
  const segments = [
    { value: done, className: 'stroke-primary', label: 'Completed' },
    { value: open, className: 'stroke-muted-foreground/40', label: 'Open' },
    { value: overdueCount, className: 'stroke-destructive', label: 'Overdue' },
  ];

  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" role="img" aria-label={`${done} of ${total} action items completed`}>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="10" className="stroke-elevated" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="40"
                cy="40"
                r={r}
                fill="none"
                strokeWidth="10"
                className={s.className}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <svg className="h-2 w-2" viewBox="0 0 8 8" aria-hidden>
              <circle cx="4" cy="4" r="4" className={s.className.replace('stroke-', 'fill-')} />
            </svg>
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto pl-4 font-medium tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
