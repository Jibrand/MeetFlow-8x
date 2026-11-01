import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { ActionItemsView } from '../features/actions/action-items-view';

export const actionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/actions',
  component: ActionItemsView,
});
