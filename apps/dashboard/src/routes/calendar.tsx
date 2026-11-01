import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { CalendarView } from '../features/calendar/calendar-view';

export const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarView,
});
