import {
  createRootRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { AppShell } from '../components/layout/app-shell';
export const rootRoute = createRootRoute({ component: Root });
function Root() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return path.startsWith('/share/') ? (
    <Outlet />
  ) : (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
