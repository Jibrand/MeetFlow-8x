import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { RegisterForm } from '../features/auth/components/register-form';

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start turning meetings into structured notes, decisions, and action items."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
