import { apiClient, ApiError } from '../../../lib/api-client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  workspace: string;
  workspaceId?: string;
  organizationName?: string | null;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

const AUTH_STORAGE_KEY = 'meetflow-session-cache';
type AuthListener = (user: AuthUser | null) => void;

class AuthAdapter {
  private listeners = new Set<AuthListener>();
  private currentUser: AuthUser | null;
  private initialized = false;

  constructor() {
    this.currentUser = this.loadCachedUser();
    // Verify session asynchronously with server
    if (typeof window !== 'undefined') {
      this.syncSessionWithServer();
    }
  }

  private loadCachedUser(): AuthUser | null {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // sessionStorage unavailable
    }
    return null;
  }

  getUser(): AuthUser | null {
    return this.currentUser;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async syncSessionWithServer(): Promise<AuthUser | null> {
    try {
      const data = await apiClient<{
        user: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
        workspace: { id: string; name: string; slug: string; role: string; organizationName?: string | null };
        onboarding: { completed: boolean; currentStep: number; professionalRole?: string; primaryUseCases?: string[] };
      }>('/auth/me');

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        initials: this.formatInitials(data.user.name),
        role: data.workspace?.role || data.user.role,
        workspace: data.workspace?.name || `${data.user.name}'s Workspace`,
        workspaceId: data.workspace?.id,
        organizationName: data.workspace?.organizationName,
        onboardingCompleted: data.onboarding?.completed,
        onboardingStep: data.onboarding?.currentStep,
      };

      this.setUser(user);
      this.initialized = true;
      return user;
    } catch {
      // If 401 or network error when checking session, clear if session was invalid
      this.currentUser = null;
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // ignore
      }
      this.notify();
      this.initialized = true;
      return null;
    }
  }

  async login(
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const data = await apiClient<{
        user: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
        workspace: { id: string; name: string; slug: string; role: string; organizationName?: string | null };
        onboarding: { completed: boolean; currentStep: number };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        initials: this.formatInitials(data.user.name),
        role: data.workspace?.role || data.user.role,
        workspace: data.workspace?.name || `${data.user.name}'s Workspace`,
        workspaceId: data.workspace?.id,
        organizationName: data.workspace?.organizationName,
        onboardingCompleted: data.onboarding?.completed,
        onboardingStep: data.onboarding?.currentStep,
      };

      this.setUser(user);
      return { success: true, user };
    } catch (err: any) {
      return {
        success: false,
        error: err instanceof ApiError ? err.message : 'Invalid email or password.',
      };
    }
  }

  async register(
    name: string,
    email: string,
    password?: string,
    workspaceName?: string
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      const data = await apiClient<{
        user: { id: string; name: string; email: string; avatarUrl: string | null; role: string };
        workspace: { id: string; name: string; slug: string; role: string };
        onboarding: { completed: boolean; currentStep: number };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, workspaceName }),
      });

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        initials: this.formatInitials(data.user.name),
        role: data.workspace?.role || 'OWNER',
        workspace: data.workspace?.name || `${name}'s Workspace`,
        workspaceId: data.workspace?.id,
        onboardingCompleted: false,
        onboardingStep: 1,
      };

      this.setUser(user);
      return { success: true, user };
    } catch (err: any) {
      return {
        success: false,
        error:
          err instanceof ApiError
            ? err.message
            : 'Unable to create workspace account. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }

    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }

    this.currentUser = null;
    this.notify();
  }

  private setUser(user: AuthUser): void {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    this.currentUser = user;
    this.notify();
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.currentUser));
  }

  private formatInitials(name: string): string {
    return (
      name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'MF'
    );
  }
}

export const authAdapter = new AuthAdapter();
