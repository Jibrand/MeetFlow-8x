import {
  apiClient,
  ApiError,
  setSessionHint,
  resetSessionInvalidState,
  markSessionInvalid,
  withSessionLock,
} from '../../../lib/api-client';

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
  private currentUser: AuthUser | null = null;
  private initialized = false;
  private apiAvailable = true;
  private apiError: string | null = null;
  private syncPromise: Promise<AuthUser | null> | null = null;
  private epoch = 0;

  constructor() {
    // Never trust client storage before backend verification; start strictly unauthenticated
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      window.addEventListener('meetflow:session-expired', () =>
        this.forceUnauthenticated(),
      );
      window.addEventListener('storage', (event) => {
        if (event.key !== 'meetflow:session_active') return;
        if (event.newValue === null) this.forceUnauthenticated();
        else {
          resetSessionInvalidState();
          void this.syncSessionWithServer();
        }
      });
    }
    // Verify session asynchronously with server
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/share/')
    ) {
      this.syncSessionWithServer();
    }
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

  isApiAvailable(): boolean {
    return this.apiAvailable;
  }

  getApiError(): string | null {
    return this.apiError;
  }

  async syncSessionWithServer(): Promise<AuthUser | null> {
    if (this.syncPromise) {
      return this.syncPromise;
    }

    const currentEpoch = ++this.epoch;

    this.syncPromise = (async () => {
      try {
        const data = await apiClient<{
          user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
            role: string;
          };
          workspace: {
            id: string;
            name: string;
            slug: string;
            role: string;
            organizationName?: string | null;
          };
          onboarding: {
            completed: boolean;
            currentStep: number;
            professionalRole?: string;
            primaryUseCases?: string[];
          };
        }>('/auth/me');

        if (currentEpoch !== this.epoch) {
          return this.currentUser;
        }

        this.apiAvailable = true;
        this.apiError = null;
        this.initialized = true;
        setSessionHint(true);
        resetSessionInvalidState();

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
        return user;
      } catch (err: unknown) {
        if (currentEpoch !== this.epoch) {
          return this.currentUser;
        }

        this.initialized = true;

        if (
          err instanceof ApiError &&
          (err.status === 0 ||
            err.code === 'API_UNAVAILABLE' ||
            err.code === 'NETWORK_ERROR' ||
            err.code === 'TIMEOUT')
        ) {
          // Backend offline / connection refused
          this.currentUser = null;
          this.apiAvailable = false;
          this.apiError = 'Unable to connect. Please try again.';
          this.notify();
          return null;
        }

        // Expected unauthenticated state (401 from /auth/me)
        this.apiAvailable = true;
        this.apiError = null;
        this.currentUser = null;
        markSessionInvalid();
        try {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore
        }
        this.notify();
        return null;
      } finally {
        this.syncPromise = null;
      }
    })();

    return this.syncPromise;
  }

  async login(
    email: string,
    password?: string,
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      ++this.epoch;
      resetSessionInvalidState();
      const data = await apiClient<{
        user: {
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
          role: string;
        };
        workspace: {
          id: string;
          name: string;
          slug: string;
          role: string;
          organizationName?: string | null;
        };
        onboarding: { completed: boolean; currentStep: number };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      this.apiAvailable = true;
      this.apiError = null;
      this.initialized = true;
      setSessionHint(true);
      resetSessionInvalidState();

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
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        (err.status === 0 || err.code === 'API_UNAVAILABLE')
      ) {
        this.apiAvailable = false;
        this.apiError = err.message;
        this.notify();
        return {
          success: false,
          error: 'Unable to connect. Please try again.',
        };
      }
      this.apiAvailable = true;
      this.apiError = null;
      this.notify();
      return {
        success: false,
        error:
          err instanceof ApiError ? err.message : 'Invalid email or password.',
      };
    }
  }

  async register(
    name: string,
    email: string,
    password?: string,
    workspaceName?: string,
  ): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    try {
      ++this.epoch;
      resetSessionInvalidState();
      const data = await apiClient<{
        user: {
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
          role: string;
        };
        workspace: { id: string; name: string; slug: string; role: string };
        onboarding: { completed: boolean; currentStep: number };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, workspaceName }),
      });

      this.apiAvailable = true;
      this.apiError = null;
      this.initialized = true;
      setSessionHint(true);
      resetSessionInvalidState();

      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        initials: this.formatInitials(data.user.name),
        role: data.workspace?.role || 'OWNER',
        workspace: data.workspace?.name || `${name}'s Workspace`,
        workspaceId: data.workspace?.id,
        onboardingCompleted: true,
        onboardingStep: 1,
      };

      this.setUser(user);
      return { success: true, user };
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        (err.status === 0 || err.code === 'API_UNAVAILABLE')
      ) {
        this.apiAvailable = false;
        this.apiError = err.message;
        this.notify();
        return {
          success: false,
          error: 'Unable to connect. Please try again.',
        };
      }
      this.apiAvailable = true;
      this.apiError = null;
      this.notify();
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
    ++this.epoch;
    // 1. Call backend to revoke database session and clear HTTP-only cookies
    await withSessionLock(() =>
      apiClient('/auth/logout', { method: 'POST', body: '{}' }),
    );

    // 2. Clear authenticated state upon successful revocation
    this.currentUser = null;
    this.initialized = true;
    markSessionInvalid();
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notify();
  }

  forceUnauthenticated(): void {
    ++this.epoch;
    this.currentUser = null;
    this.initialized = true;
    markSessionInvalid();
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* Storage may be unavailable. */
    }
    this.notify();
  }

  private setUser(user: AuthUser): void {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    this.currentUser = user;
    this.initialized = true;
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
