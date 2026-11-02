import { createRouter, createRoute } from '@tanstack/react-router';
import { publicMeetingRoute } from './routes/public-meeting';
import { rootRoute } from './routes/root';
import { indexRoute, MeetingsPage } from './routes/index';
import { overviewRoute } from './routes/overview';
import { designRoute } from './routes/design';
import { meetingDetailRoute } from './routes/meeting-detail';
import { actionsRoute } from './routes/actions';
import { calendarRoute } from './routes/calendar';
import { askRoute } from './routes/ask';
import { settingsRoute } from './routes/settings';
import { loginRoute } from './routes/login';
import { registerRoute } from './routes/register';
import { forgotPasswordRoute } from './routes/forgot-password';
import { onboardingRoute } from './routes/onboarding';

// /meetings route acts as an alias to the main MeetingsPage library
const meetingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/meetings',
  component: MeetingsPage,
});

const routeTree = rootRoute.addChildren([
  publicMeetingRoute,
  indexRoute,
  overviewRoute,
  meetingsRoute,
  meetingDetailRoute,
  actionsRoute,
  calendarRoute,
  askRoute,
  settingsRoute,
  designRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  onboardingRoute,
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
