import { useNavigate } from '@tanstack/react-router';
import { Button, toast } from '@meetflow/ui';
import { AudioLines, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../hooks/use-onboarding';
import { RoleStep } from './role-step';
import { UseCaseStep } from './use-case-step';
import { WorkspaceStep } from './workspace-step';
import { GoogleConnectStep } from './google-connect-step';
import { CompleteStep } from './complete-step';

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  'Professional Role',
  'Primary Use Case',
  'Workspace Setup',
  'Connect Google',
  'Ready to Go',
];

export function OnboardingShell() {
  const navigate = useNavigate();
  const {
    state,
    setStep,
    setRole,
    toggleUseCase,
    setWorkspaceName,
    setOrgName,
    setGoogleConnected,
    saveWorkspaceToBackend,
    completeOnboarding,
    reset,
  } = useOnboarding();

  const handleNext = async () => {
    if (state.step === 3) {
      if (!state.workspaceName.trim()) {
        toast.error('Please enter a workspace name');
        return;
      }
      await saveWorkspaceToBackend(state.workspaceName, state.orgName);
    }
    if (state.step < TOTAL_STEPS) {
      setStep(state.step + 1);
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setStep(state.step - 1);
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    reset();
    toast.success('Onboarding complete! Enjoy MeetFlow AI.');
    navigate({ to: '/' });
  };

  const progressPercent = Math.round((state.step / TOTAL_STEPS) * 100);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      {/* Onboarding Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4 sm:px-8 bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <AudioLines className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold tracking-tight">MeetFlow Setup</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">{STEP_TITLES[state.step - 1]}</span>
          <span className="font-mono text-[11px] font-semibold text-foreground">
            {state.step} / {TOTAL_STEPS}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Content Area */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs">
            {state.step === 1 && (
              <RoleStep selectedRole={state.role} onSelectRole={setRole} />
            )}
            {state.step === 2 && (
              <UseCaseStep
                selectedCases={state.useCases}
                onToggleCase={toggleUseCase}
              />
            )}
            {state.step === 3 && (
              <WorkspaceStep
                workspaceName={state.workspaceName}
                orgName={state.orgName}
                onWorkspaceNameChange={setWorkspaceName}
                onOrgNameChange={setOrgName}
              />
            )}
            {state.step === 4 && (
              <GoogleConnectStep
                connected={state.googleConnected}
                onToggleConnect={setGoogleConnected}
              />
            )}
            {state.step === 5 && (
              <CompleteStep state={state} onFinish={handleFinish} />
            )}

            {/* Bottom Navigation Buttons (Steps 1-4) */}
            {state.step < 5 && (
              <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={state.step === 1}
                  className="h-8 text-xs gap-1.5 disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>

                <div className="flex items-center gap-2">
                  {state.step === 4 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleNext}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Skip for now
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    className="h-8 text-xs px-4 gap-1.5 font-semibold shadow-xs"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
