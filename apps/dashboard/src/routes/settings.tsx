import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { SettingsView } from '../features/settings/settings-view';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsView,
});
