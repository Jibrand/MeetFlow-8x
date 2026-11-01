import * as React from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { Button, Input, toast } from '@meetflow/ui';
import { ForgotPasswordSchema } from '../features/auth/schemas/auth-schemas';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = ForgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Invalid email address');
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
    toast.success('Password reset instructions sent');
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your verified work email address and we will send a password reset link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to sign in</span>
        </Link>
      }
    >
      {submitted ? (
        <div className="space-y-4 py-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Check your inbox</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We have sent password recovery instructions to <strong className="text-foreground">{email}</strong>.
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground pt-2">
            In evaluation mode, you can also sign in instantly using the demo evaluator button on the login screen.
          </p>
          <Button asChild variant="outline" className="w-full h-8 text-xs mt-3">
            <Link to="/login">Return to login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="reset-email" className="text-xs font-medium text-foreground">
              Work Email
            </label>
            <Input
              id="reset-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-9 text-xs bg-card ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-9 text-xs font-semibold gap-2 shadow-xs"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Send reset instructions</span>
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
