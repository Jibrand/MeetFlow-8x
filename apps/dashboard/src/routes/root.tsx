import * as React from 'react';
import {
  createRootRoute,
  Outlet,
  useRouterState,
  useRouter,
  redirect,
} from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../components/layout/app-shell';
import { authAdapter } from '../features/auth/lib/auth-adapter';
import { Loader2 } from 'lucide-react';
const isAuthPage = (path: string) => ['/login', '/register'].includes(path);
export const rootRoute = createRootRoute({
  beforeLoad: async ({ location }) => {
    const user = await authAdapter.syncSessionWithServer();
    if (!user && !isAuthPage(location.pathname))
      throw redirect({ to: '/login', replace: true });
    if (user && isAuthPage(location.pathname))
      throw redirect({ to: '/', replace: true });
  },
  pendingComponent: SessionLoading,
  component: Root,
});
function SessionLoading() {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center gap-2 bg-background text-sm text-muted-foreground"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      Restoring your session…
    </div>
  );
}
function Root() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const router = useRouter();
  const client = useQueryClient();
  const [user, setUser] = React.useState(() => authAdapter.getCurrentUser());
  React.useEffect(() => {
    let previousId = authAdapter.getCurrentUser()?.id;
    return authAdapter.subscribe((next) => {
      setUser(next);
      if (previousId === next?.id) return;
      previousId = next?.id;
      if (!next) {
        void client.cancelQueries();
        client.clear();
      }
      void router.invalidate();
    });
  }, [client, router]);
  if (isAuthPage(path)) return <Outlet />;
  if (!user) return <SessionLoading />;
  if (path.startsWith('/share/')) return <Outlet />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
