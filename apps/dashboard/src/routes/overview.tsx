import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { OverviewView } from '../features/overview/overview-view';

export const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: OverviewView,
});
