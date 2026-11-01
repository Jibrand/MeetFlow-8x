import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { LoginForm } from '../features/auth/components/login-form';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your MeetFlow AI workspace to review your meeting intelligence."
      footer={
        <p>
          Don't have a workspace?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create workspace
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
