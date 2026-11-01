import { createRouter, createRoute } from '@tanstack/react-router';
import { rootRoute } from './routes/root';
import { indexRoute, MeetingsPage } from './routes/index';
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  meetingsRoute,
  meetingDetailRoute,
  actionsRoute,
  calendarRoute,
  askRoute,
  settingsRoute,
  designRoute,
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
