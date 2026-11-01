import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { AppShell } from '../components/layout/app-shell';
import { authAdapter } from '../features/auth/lib/auth-adapter';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/onboarding'];

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => authAdapter.isAuthenticated());

  React.useEffect(() => {
    return authAdapter.subscribe((user) => {
      setIsAuthenticated(user !== null);
    });
  }, []);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Protected route guard: Redirect unauthenticated users to /login
  React.useEffect(() => {
    if (!isAuthenticated && !isPublic) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, isPublic, navigate]);

  if (isPublic) {
    return <Outlet />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
