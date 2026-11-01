import * as React from 'react';
import { apiClient } from '../../../lib/api-client';
import { authAdapter } from '../../auth/lib/auth-adapter';

export interface OnboardingState {
  step: number;
  role: string;
  useCases: string[];
  workspaceName: string;
  orgName: string;
  googleConnected: boolean;
  loading: boolean;
}

const STORAGE_KEY = 'meetflow-onboarding-draft';

const DEFAULT_STATE: OnboardingState = {
  step: 1,
  role: 'Engineering',
  useCases: ['Automatic meeting notes', 'Follow-up actions'],
  workspaceName: "My Workspace",
  orgName: '',
  googleConnected: false,
  loading: false,
};

export function useOnboarding() {
  const [state, setState] = React.useState<OnboardingState>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) return { ...JSON.parse(stored), loading: false };
    } catch {
      // ignore
    }
    const currentUser = authAdapter.getCurrentUser();
    return {
      ...DEFAULT_STATE,
      workspaceName: currentUser?.workspace || DEFAULT_STATE.workspaceName,
      orgName: currentUser?.organizationName || '',
    };
  });

  // Fetch persisted onboarding state from Neon backend
  React.useEffect(() => {
    let isMounted = true;

    async function loadServerState() {
      try {
        const data = await apiClient<{
          currentStep: number;
          professionalRole: string | null;
          selectedUseCases: string[];
          completed: boolean;
          workspace: { id: string; name: string; organizationName?: string | null } | null;
          googleConnected: boolean;
        }>('/onboarding');

        if (isMounted && data) {
          setState((prev) => ({
            ...prev,
            step: data.currentStep || prev.step,
            role: data.professionalRole || prev.role,
            useCases: data.selectedUseCases?.length ? data.selectedUseCases : prev.useCases,
            workspaceName: data.workspace?.name || prev.workspaceName,
            orgName: data.workspace?.organizationName || prev.orgName,
            googleConnected: false,
          }));
        }
      } catch {
        // Backend not yet available or offline; draft remains in sessionStorage
      }
    }

    loadServerState();
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const setStep = (step: number) => {
    setState((prev) => ({ ...prev, step }));
    apiClient('/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ currentStep: step }),
    }).catch(() => {});
  };

  const setRole = (role: string) => {
    setState((prev) => ({ ...prev, role }));
    apiClient('/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ professionalRole: role }),
    }).catch(() => {});
  };

  const toggleUseCase = (useCase: string) => {
    setState((prev) => {
      const updatedCases = prev.useCases.includes(useCase)
        ? prev.useCases.filter((u) => u !== useCase)
        : [...prev.useCases, useCase];

      apiClient('/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({ primaryUseCases: updatedCases }),
      }).catch(() => {});

      return { ...prev, useCases: updatedCases };
    });
  };

  const setWorkspaceName = (workspaceName: string) =>
    setState((prev) => ({ ...prev, workspaceName }));

  const setOrgName = (orgName: string) =>
    setState((prev) => ({ ...prev, orgName }));

  const setGoogleConnected = (googleConnected: boolean) =>
    setState((prev) => ({ ...prev, googleConnected }));

  const saveWorkspaceToBackend = async (wsName: string, org: string) => {
    try {
      await apiClient('/onboarding/workspace', {
        method: 'POST',
        body: JSON.stringify({ workspaceName: wsName, orgName: org || undefined }),
      });
      await authAdapter.syncSessionWithServer();
    } catch {
      // ignore
    }
  };

  const completeOnboarding = async () => {
    try {
      await apiClient('/onboarding/complete', { method: 'POST' });
      await authAdapter.syncSessionWithServer();
    } catch {
      // ignore
    }
  };

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
    saveWorkspaceToBackend,
    completeOnboarding,
    reset,
  };
}
