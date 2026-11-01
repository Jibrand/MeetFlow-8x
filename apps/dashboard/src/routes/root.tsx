import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { AppShell } from '../components/layout/app-shell';
import { authAdapter, AuthUser } from '../features/auth/lib/auth-adapter';

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

  React.useEffect(() => {
    return authAdapter.subscribe((user) => {
      setCurrentUser(user);
    });
  }, []);

  const isAuthenticated = currentUser !== null;
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isOnboardingPage = pathname === '/onboarding';

  React.useEffect(() => {
    // 1. Unauthenticated users must sign in
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
  }, [isAuthenticated, isAuthPage, isOnboardingPage, currentUser, navigate]);

  // Auth pages & onboarding render in focused full-screen layouts
  if (isAuthPage || isOnboardingPage) {
    return <Outlet />;
  }

  // Dashboard workspace views render in AppShell
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
