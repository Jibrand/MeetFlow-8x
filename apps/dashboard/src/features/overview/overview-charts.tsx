import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MeetingItem, ActionItemData } from '../../types/meeting';

export interface MeetingsOverTimeChartProps {
  meetings: MeetingItem[];
  now?: Date;
}

/** Meetings recorded over the last 7 days derived from real seeded meetings data */
export function MeetingsOverTimeChart({ meetings, now = new Date() }: MeetingsOverTimeChartProps) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));

    const next = new Date(d);
    next.setDate(d.getDate() + 1);

    const count = meetings.filter((m) => {
      const t = new Date(m.startDate).getTime();
      return m.status !== 'scheduled' && t >= d.getTime() && t < next.getTime();
    }).length;

    return {
      day: d.toLocaleDateString(undefined, { weekday: 'short' }),
      date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      meetings: count,
    };
  });

  return (
    <div className="w-full">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="day"
              stroke="currentColor"
              className="text-[11px] text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="currentColor"
              className="text-[11px] text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { day: string; date: string; meetings: number };
                return (
                  <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-md">
                    <p className="font-semibold text-popover-foreground">{d.date}</p>
                    <p className="text-muted-foreground">
                      <span className="font-mono font-semibold text-primary">{d.meetings}</span>{' '}
                      {d.meetings === 1 ? 'meeting recorded' : 'meetings recorded'}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="meetings" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export interface ActionItemDonutProps {
  items: ActionItemData[];
}

/** Donut chart showing action item resolution (completed vs open) with center total */
export function ActionItemDonut({ items }: ActionItemDonutProps) {
  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const open = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [
    { name: 'Completed', value: completed, color: '#D97706' },
    { name: 'Open', value: open, color: 'hsl(var(--muted-foreground) / 0.35)' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-md">
                    <p className="font-semibold text-popover-foreground">{d.name}</p>
                    <p className="font-mono text-muted-foreground">{d.value} items</p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Counter */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {completionRate}%
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Resolved
          </span>
        </div>
      </div>

      {/* Compact Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>Completed: <strong className="font-mono text-foreground">{completed}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
          <span>Open: <strong className="font-mono text-foreground">{open}</strong></span>
        </div>
      </div>
    </div>
  );
}
