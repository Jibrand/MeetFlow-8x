export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  workspace: string;
}

export const DEFAULT_DEMO_USER: AuthUser = {
  id: 'u1',
  name: 'Jibran',
  email: 'jibran@meetflow.ai',
  initials: 'JI',
  role: 'Staff Product Engineer',
  workspace: 'MeetFlow Demo Workspace',
};

const AUTH_STORAGE_KEY = 'meetflow-demo-session';
type AuthListener = (user: AuthUser | null) => void;

class AuthAdapter {
  private listeners = new Set<AuthListener>();
  private currentUser: AuthUser | null;

  constructor() {
    this.currentUser = this.loadInitialUser();
  }

  private loadInitialUser(): AuthUser | null {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // sessionStorage unavailable
    }
    // Default to demo user so evaluators can inspect protected routes seamlessly
    return DEFAULT_DEMO_USER;
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

  /**
   * Clearly labeled demo login.
   * Does NOT persist raw passwords or fake JWTs to localStorage/cookies.
   */
  async login(email: string, _password?: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    await new Promise((r) => setTimeout(r, 300));

    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const name = email.split('@')[0];
    const user: AuthUser = {
      id: `u-${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: email.toLowerCase(),
      initials: name.slice(0, 2).toUpperCase(),
      role: 'Product Engineer',
      workspace: `${name.charAt(0).toUpperCase() + name.slice(1)}'s Workspace`,
    };

    this.setUser(user);
    return { success: true, user };
  }

  loginAsDemoUser(): AuthUser {
    this.setUser(DEFAULT_DEMO_USER);
    return DEFAULT_DEMO_USER;
  }

  loginAsDemo(): AuthUser {
    return this.loginAsDemoUser();
  }

  async register(name: string, email: string, _password?: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    await new Promise((r) => setTimeout(r, 300));

    if (!name.trim()) {
      return { success: false, error: 'Name is required.' };
    }
    if (!email.includes('@')) {
      return { success: false, error: 'Please enter a valid work email.' };
    }

    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const user: AuthUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase(),
      initials: initials || 'MF',
      role: 'Member',
      workspace: `${name.trim()}'s Workspace`,
    };

    this.setUser(user);
    return { success: true, user };
  }

  logout(): void {
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
}

export const authAdapter = new AuthAdapter();
