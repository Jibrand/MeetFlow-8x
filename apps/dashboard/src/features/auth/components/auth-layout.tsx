import * as React from 'react';
import { AudioLines } from 'lucide-react';
import { Badge } from '@meetflow/ui';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
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

        {/* Demo Notice Banner */}
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-[11px] text-muted-foreground">
          <span>8x Assignment Demo Mode</span>
          <Badge variant="secondary" className="text-[10px] py-0">
            Offline Mock
          </Badge>
        </div>

        {footer && <div className="text-center text-xs text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
