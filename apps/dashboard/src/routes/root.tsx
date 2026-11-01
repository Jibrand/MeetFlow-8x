import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { AppShell } from '../components/layout/app-shell';
import { authAdapter, AuthUser } from '../features/auth/lib/auth-adapter';
import { Button } from '@meetflow/ui';
import { AlertCircle, RefreshCw, AudioLines, Loader2, WifiOff } from 'lucide-react';

const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function AuthLoadingScreen() {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs animate-in fade-in duration-200">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <AudioLines className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">MeetFlow AI</h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Verifying session...</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ApiUnavailableScreen({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <WifiOff className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            MeetFlow Backend Unavailable
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unable to connect to the backend server at{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              http://localhost:4000
            </code>
            . Session authentication could not be verified.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 pt-2">
          <Button
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full h-9 text-xs font-semibold gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Reconnecting...' : 'Retry Connection'}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/login' })}
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}

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

  // 1. If visiting an auth page (/login, /register, /forgot-password)
  if (isAuthPage) {
    if (isInitialized && isAuthenticated) {
      // Authenticated user on auth page: show loader while redirect effect navigates to dashboard
      return <AuthLoadingScreen />;
    }
    return (
      <div className="min-h-dvh flex flex-col">
        {offlineBanner}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    );
  }

  // 2. Protected Routes: While session bootstrap is in flight, display clean loading screen
  if (!isInitialized) {
    return <AuthLoadingScreen />;
  }

  // 3. Protected Routes: If backend is completely unreachable, display retryable error screen (never grant dashboard access)
  if (!apiAvailable) {
    return (
      <ApiUnavailableScreen
        onRetry={handleRetryConnection}
        isRetrying={isRetrying}
      />
    );
  }

  // 4. Protected Routes: If unauthenticated, show loader while redirect effect navigates to /login
  if (!isAuthenticated) {
    return <AuthLoadingScreen />;
  }

  // 5. Onboarding view for authenticated users
  if (isOnboardingPage) {
    return (
      <div className="min-h-dvh flex flex-col">
        {offlineBanner}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    );
  }

  // 6. Verified authenticated dashboard workspace views in AppShell
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
