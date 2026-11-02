import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { useRegistrationStatus } from '../features/auth/lib/use-registration-status';
import { LoginForm } from '../features/auth/components/login-form';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

function LoginPage() {
  const registration = useRegistrationStatus();
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your MeetFlow AI workspace to review your meeting intelligence."
      footer={
        <p>
          {registration.data?.registrationOpen ? (
            <>
              <span>Setting up MeetFlow? </span>
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Create admin account
              </Link>
            </>
          ) : (
            'Your private, single-admin workspace.'
          )}
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
