import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from './hooks/use-onboarding';

vi.mock('../../../lib/api-client', () => ({
  apiClient: vi.fn().mockResolvedValue({}),
}));

describe('useOnboarding', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with default role and step 1', () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.state.step).toBe(1);
    expect(result.current.state.role).toBe('Engineering');
    expect(result.current.state.workspaceName).toBe('My Workspace');
  });

  it('updates role and advances step', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.setRole('Executive / Leadership');
      result.current.setStep(2);
    });

    expect(result.current.state.role).toBe('Executive / Leadership');
    expect(result.current.state.step).toBe(2);
  });

  it('toggles use cases correctly', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.toggleUseCase('Executive summaries');
    });
    expect(result.current.state.useCases).toContain('Executive summaries');

    act(() => {
      result.current.toggleUseCase('Executive summaries');
    });
    expect(result.current.state.useCases).not.toContain('Executive summaries');
  });

  it('updates workspace and organization details', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.setWorkspaceName('Acme Growth Labs');
      result.current.setOrgName('Acme Inc.');
    });

    expect(result.current.state.workspaceName).toBe('Acme Growth Labs');
    expect(result.current.state.orgName).toBe('Acme Inc.');
  });

  it('resets to defaults when complete', () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.setStep(5);
      result.current.setWorkspaceName('Custom Work');
      result.current.reset();
    });

    expect(result.current.state.step).toBe(1);
    expect(result.current.state.workspaceName).toBe('My Workspace');
  });
});
