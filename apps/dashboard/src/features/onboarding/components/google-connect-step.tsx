import { Calendar, Video, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, Badge, toast } from '@meetflow/ui';

export interface GoogleConnectStepProps {
  connected: boolean;
  onToggleConnect: (val: boolean) => void;
}

export function GoogleConnectStep({ connected, onToggleConnect }: GoogleConnectStepProps) {
  const handleConnectClick = () => {
    toast.info('Google Workspace connection is optional. You can connect or skip to complete onboarding.');
    onToggleConnect(!connected);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          Connect Google Workspace
        </h2>
        <p className="text-xs text-muted-foreground">
          Synchronize upcoming calendar events and automatically schedule AI meeting note taking.
        </p>
      </div>

      {/* Main Google Integration Card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-foreground">Google Calendar & Meet</h3>
                <Badge
                  variant={connected ? 'success' : 'secondary'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {connected ? 'Simulated Connected' : 'Disconnected'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Imports calendar events and generates automated executive summaries for scheduled Google Meet calls.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant={connected ? 'outline' : 'default'}
            size="sm"
            onClick={handleConnectClick}
            className="h-8 text-xs shrink-0"
          >
            {connected ? 'Disconnect' : 'Connect Google'}
          </Button>
        </div>

        {/* Transparent Capability & Permission Explanations */}
        <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-2 border border-border/50">
          <div className="flex items-start gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Calendar Access:</strong> Reads meeting titles, attendee emails, and scheduled start times to prepare note taking before each call.
            </span>
          </div>

          <div className="flex items-start gap-2">
            <Video className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Google Meet Capture:</strong> Automatic audio recording requires a meeting bot or native audio stream ingestion (configured in backend deployment).
            </span>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">Scope Privacy:</strong> Read-only calendar metadata scope (<code className="font-mono text-[10px]">https://www.googleapis.com/auth/calendar.readonly</code>). Never modifies calendar events without authorization.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span>You can skip Google connection now and proceed with pre-seeded demo meetings.</span>
      </div>
    </div>
  );
}
