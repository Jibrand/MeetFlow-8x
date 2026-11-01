import * as React from 'react';

export interface OnboardingState {
  step: number;
  role: string;
  useCases: string[];
  workspaceName: string;
  orgName: string;
  googleConnected: boolean;
}

const STORAGE_KEY = 'meetflow-onboarding-draft';

const DEFAULT_STATE: OnboardingState = {
  step: 1,
  role: 'Engineering',
  useCases: ['Automatic meeting notes', 'Follow-up actions'],
  workspaceName: "Jibran's Workspace",
  orgName: 'MeetFlow AI Demo',
  googleConnected: false,
};

export function useOnboarding() {
  const [state, setState] = React.useState<OnboardingState>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_STATE;
  });

  React.useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const setStep = (step: number) => setState((prev) => ({ ...prev, step }));
  const setRole = (role: string) => setState((prev) => ({ ...prev, role }));
  const toggleUseCase = (useCase: string) =>
    setState((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(useCase)
        ? prev.useCases.filter((u) => u !== useCase)
        : [...prev.useCases, useCase],
    }));
  const setWorkspaceName = (workspaceName: string) =>
    setState((prev) => ({ ...prev, workspaceName }));
  const setOrgName = (orgName: string) => setState((prev) => ({ ...prev, orgName }));
  const setGoogleConnected = (googleConnected: boolean) =>
    setState((prev) => ({ ...prev, googleConnected }));
  const reset = () => {
    setState(DEFAULT_STATE);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return {
    state,
    setStep,
    setRole,
    toggleUseCase,
    setWorkspaceName,
    setOrgName,
    setGoogleConnected,
    reset,
  };
}
