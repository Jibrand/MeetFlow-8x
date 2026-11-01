import * as React from 'react';
import { AudioLines, CheckCircle2, WifiOff } from 'lucide-react';
import { Badge } from '@meetflow/ui';
import { authAdapter } from '../lib/auth-adapter';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const [apiAvailable, setApiAvailable] = React.useState(() => authAdapter.isApiAvailable());

  React.useEffect(() => {
    return authAdapter.subscribe(() => {
      setApiAvailable(authAdapter.isApiAvailable());
    });
  }, []);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <AudioLines className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-foreground">MeetFlow AI</span>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          {children}
        </div>

        {/* Backend & Database Status Indicator */}
        {apiAvailable ? (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Real Database Auth</span>
            </div>
            <Badge
              variant="secondary"
              className="text-[10px] py-0 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            >
              Neon PostgreSQL Connected
            </Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            <div className="flex items-center gap-2">
              <WifiOff className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span>Backend Offline</span>
            </div>
            <span className="text-[10px] font-mono">http://localhost:4000</span>
          </div>
        )}

        {footer && <div className="text-center text-xs text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
