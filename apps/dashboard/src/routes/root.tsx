import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '../components/layout/app-shell';

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
