import * as React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Input, toast } from '@meetflow/ui';
import { PasswordField } from './password-field';
import { LoginSchema } from '../schemas/auth-schemas';
import { authAdapter } from '../lib/auth-adapter';
import { Loader2, ArrowRight } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('jibran@meetflow.ai');
  const [password, setPassword] = React.useState('password123');
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as 'email' | 'password';
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const result = await authAdapter.login(email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Signed in successfully');
      navigate({ to: '/' });
    } else {
      toast.error(result.error || 'Failed to sign in');
    }
  };

  const handleDemoSignIn = () => {
    authAdapter.loginAsDemoUser();
    toast.success('Signed in as Demo Evaluator');
    navigate({ to: '/' });
  };

  const handleGoogleSignIn = () => {
    toast.info('Google OAuth connects in Phase 05 backend integration.');
    authAdapter.loginAsDemoUser();
    navigate({ to: '/' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1-Click Instant Demo Login for Evaluator */}
      <Button
        type="button"
        variant="outline"
        onClick={handleDemoSignIn}
        className="w-full h-9 text-xs font-semibold gap-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
      >
        <span>Enter as Demo Evaluator (Instant)</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          or continue with email
        </span>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-foreground">
          Work Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-9 text-xs bg-card ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
      </div>

      <PasswordField
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
          <input type="checkbox" defaultChecked className="rounded accent-primary h-3.5 w-3.5" />
          <span>Remember me</span>
        </label>
        <Link
          to="/forgot-password"
          className="text-primary hover:underline font-medium"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-9 text-xs font-semibold gap-2 shadow-xs"
      >
        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>Sign in</span>
      </Button>

      {/* Google Sign In entry point */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full h-9 text-xs font-medium gap-2 border-border"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </Button>
    </form>
  );
}
