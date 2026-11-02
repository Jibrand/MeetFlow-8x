import * as React from 'react';
import { createRouter, createRoute, redirect } from '@tanstack/react-router';
import { ManagementView } from './features/projects/management-view';
import { BoardView } from './features/projects/board-view';
import { IntelligenceView } from './features/projects/intelligence-view';
import { publicMeetingRoute } from './routes/public-meeting';
import { loginRoute } from './routes/login';
import { registerRoute } from './routes/register';
import { rootRoute } from './routes/root';
import { indexRoute, MeetingsPage } from './routes/index';
import { overviewRoute } from './routes/overview';
import { designRoute } from './routes/design';
import { meetingDetailRoute } from './routes/meeting-detail';
import { actionsRoute } from './routes/actions';
import { calendarRoute } from './routes/calendar';
import { askRoute } from './routes/ask';
import { settingsRoute } from './routes/settings';

// /meetings route acts as an alias to the main MeetingsPage library
const meetingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meetings',
  component: MeetingsPage,
});

const legacyRoutes = (['/forgot-password', '/onboarding'] as const).map(
  (path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      beforeLoad: () => {
        throw redirect({ to: '/' });
      },
    }),
);
const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: ManagementView,
});
const boardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/board',
  component: BoardView,
});
const decisionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/decisions',
  component: () => React.createElement(IntelligenceView),
});
const followupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/followups',
  beforeLoad: () => {
    throw redirect({ to: '/board' });
  },
});
const aiActionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ai-actions',
  component: () => React.createElement(IntelligenceView, { mode: 'actions' }),
});
const routeTree = rootRoute.addChildren([
  publicMeetingRoute,
  loginRoute,
  registerRoute,
  indexRoute,
  overviewRoute,
  meetingsRoute,
  meetingDetailRoute,
  actionsRoute,
  calendarRoute,
  askRoute,
  settingsRoute,
  designRoute,
  ...legacyRoutes,
  projectsRoute,
  boardRoute,
  decisionsRoute,
  followupsRoute,
  aiActionsRoute,
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
