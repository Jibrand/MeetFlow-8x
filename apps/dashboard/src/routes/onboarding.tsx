import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { OnboardingShell } from '../features/onboarding/components/onboarding-shell';

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
});

function OnboardingPage() {
  return <OnboardingShell />;
}
