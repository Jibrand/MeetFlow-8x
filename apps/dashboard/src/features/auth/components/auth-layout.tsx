import * as React from 'react';
import { AudioLines, WifiOff } from 'lucide-react';
import { authAdapter } from '../lib/auth-adapter';

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const [apiAvailable, setApiAvailable] = React.useState(() =>
    authAdapter.isApiAvailable(),
  );

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
            <span className="text-base font-bold tracking-tight text-foreground">
              MeetFlow AI
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
          {children}
        </div>

        {!apiAvailable && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Unable to connect. Check your connection and try again.</span>
          </div>
        )}

        {footer && (
          <div className="text-center text-xs text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
