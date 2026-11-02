import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { Button, Skeleton } from '@meetflow/ui';
import { useRegistrationStatus } from '../features/auth/lib/use-registration-status';
import { RegisterForm } from '../features/auth/components/register-form';

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

function RegisterPage() {
  const registration = useRegistrationStatus();
  return (
    <AuthLayout
      title="Set up your admin account"
      subtitle="Create the one admin account for your MeetFlow workspace. Registration closes after setup."
      footer={
        <p>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {registration.isPending ? (
        <Skeleton className="h-72" />
      ) : registration.error ? (
        <div role="alert" className="space-y-3 text-sm">
          <p>{registration.error.message}</p>
          <Button variant="outline" onClick={() => void registration.refetch()}>
            Try again
          </Button>
        </div>
      ) : registration.data?.registrationOpen ? (
        <RegisterForm />
      ) : (
        <div className="space-y-3 text-sm">
          <h2 className="font-semibold">Admin registration is closed</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This workspace already has an admin. Sign in with the existing
            account to continue.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
