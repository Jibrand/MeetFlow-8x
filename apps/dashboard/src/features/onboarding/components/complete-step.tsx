import { CheckCircle2, Building, User, Calendar, ArrowRight } from 'lucide-react';
import { Button, Badge } from '@meetflow/ui';
import { OnboardingState } from '../hooks/use-onboarding';

export interface CompleteStepProps {
  state: OnboardingState;
  onFinish: () => void;
}

export function CompleteStep({ state, onFinish }: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center py-2">
      <div className="space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          You're all set!
        </h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Your workspace has been provisioned and your meeting library is ready with demo recordings.
        </p>
      </div>

      {/* Summary Recap Card */}
      <div className="rounded-xl border border-border bg-card p-4 text-left space-y-3 max-w-md mx-auto shadow-xs">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-primary" />
            <span>Workspace</span>
          </span>
          <span className="font-semibold text-foreground">{state.workspaceName || "Jibran's Workspace"}</span>
        </div>

        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>Role</span>
          </span>
          <span className="font-semibold text-foreground">{state.role}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Google Connection</span>
          </span>
          <Badge
            variant={state.googleConnected ? 'success' : 'secondary'}
            className="text-[10px] py-0"
          >
            {state.googleConnected ? 'Connected' : 'Skipped (Disconnected)'}
          </Badge>
        </div>
      </div>

      <Button
        onClick={onFinish}
        size="lg"
        className="h-10 px-6 text-xs font-semibold gap-2 shadow-xs"
      >
        <span>Open My Meetings</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
