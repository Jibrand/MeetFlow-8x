import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { AskMeetFlowView } from '../features/ask/ask-view';

export const askRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ask',
  component: AskMeetFlowView,
});
