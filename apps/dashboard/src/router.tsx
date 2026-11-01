import { createRouter, createRoute } from '@tanstack/react-router';
import { rootRoute } from './routes/root';
import { indexRoute } from './routes/index';
import { designRoute } from './routes/design';

// Future route conventions (ready for upcoming phases)
const meetingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'meetings',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Meetings Library (Planned for Phase 02)
    </div>
  ),
});

const meetingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'meetings/$meetingId',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Meeting Detail Workspace (Planned for Phase 03)
    </div>
  ),
});

const actionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'actions',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Action Items Workspace (Planned for Phase 04)
    </div>
  ),
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'calendar',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Calendar Integration (Planned for Phase 05)
    </div>
  ),
});

const askRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'ask',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Ask AI Workspace (Planned for Phase 06)
    </div>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'settings',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Settings & Workspace Preferences
    </div>
  ),
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'share/$token',
  component: () => (
    <div className="p-8 text-center text-xs text-muted-foreground">
      Public Share Route (Planned for Phase 07)
    </div>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  designRoute,
  meetingsRoute,
  meetingDetailRoute,
  actionsRoute,
  calendarRoute,
  askRoute,
  settingsRoute,
  shareRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
