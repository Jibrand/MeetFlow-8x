import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { AppShell } from '../components/layout/app-shell';
import { authAdapter, AuthUser } from '../features/auth/lib/auth-adapter';
import { AlertCircle, RefreshCw } from 'lucide-react';

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState<AuthUser | null>(() =>
    authAdapter.getCurrentUser()
  );
  const [isInitialized, setIsInitialized] = React.useState(() => authAdapter.isInitialized());
  const [apiAvailable, setApiAvailable] = React.useState(() => authAdapter.isApiAvailable());
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    return authAdapter.subscribe((user) => {
      setCurrentUser(user);
      setIsInitialized(authAdapter.isInitialized());
      setApiAvailable(authAdapter.isApiAvailable());
    });
  }, []);

  const isAuthenticated = currentUser !== null;
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isOnboardingPage = pathname === '/onboarding';

  React.useEffect(() => {
    // While initial session bootstrap is running, do not prematurely redirect away from current page
    if (!isInitialized && !isAuthPage) {
      return;
    }

    // 1. Unauthenticated users must sign in (unless already on an auth page)
    if (!isAuthenticated) {
      if (!isAuthPage) {
        navigate({ to: '/login' });
      }
      return;
    }

    // 2. Authenticated users attempting to view /login or /register
    if (isAuthPage) {
      if (currentUser?.onboardingCompleted === false) {
        navigate({ to: '/onboarding' });
      } else {
        navigate({ to: '/' });
      }
      return;
    }

    // 3. Incomplete onboarding redirect
    if (currentUser?.onboardingCompleted === false && !isOnboardingPage) {
      navigate({ to: '/onboarding' });
      return;
    }

    // 4. Already completed user on onboarding
    if (currentUser?.onboardingCompleted === true && isOnboardingPage) {
      navigate({ to: '/' });
      return;
    }
  }, [isAuthenticated, isAuthPage, isOnboardingPage, isInitialized, currentUser, navigate]);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await authAdapter.syncSessionWithServer();
    } finally {
      setIsRetrying(false);
    }
  };

  const offlineBanner = !apiAvailable && (
    <div className="w-full bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between z-50 transition-colors">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>Backend Unavailable:</strong> Unable to connect to the MeetFlow API at{' '}
          <code className="font-mono text-[11px] bg-amber-500/15 px-1 py-0.5 rounded">http://localhost:4000</code>.
          Please ensure the backend server is running.
        </span>
      </div>
      <button
        onClick={handleRetryConnection}
        disabled={isRetrying}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 rounded-md transition-colors"
      >
        <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
      </button>
    </div>
  );

  // Auth pages & onboarding render in focused full-screen layouts
  if (isAuthPage || isOnboardingPage) {
    return (
      <div className="min-h-dvh flex flex-col">
        {offlineBanner}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    );
  }

  // Dashboard workspace views render in AppShell
  return (
    <div className="min-h-dvh flex flex-col">
      {offlineBanner}
      <div className="flex-1 overflow-hidden">
        <AppShell>
          <Outlet />
        </AppShell>
      </div>
    </div>
  );
}
