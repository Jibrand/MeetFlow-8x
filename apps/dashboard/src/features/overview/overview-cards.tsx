import { Link } from '@tanstack/react-router';
import { cn } from '@meetflow/ui';

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: { label: string; to: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col rounded-xl border border-border bg-card', className)}>
      <header className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {action && (
          <Link to={action.to} className="text-[11px] font-medium text-muted-foreground hover:text-primary">
            {action.label}
          </Link>
        )}
      </header>
      <div className="flex-1 px-4 pb-4">{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}
