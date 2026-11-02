import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Input, toast } from '@meetflow/ui';
import { PasswordField } from './password-field';
import { LoginSchema } from '../schemas/auth-schemas';
import { authAdapter } from '../lib/auth-adapter';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
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
      void navigate({ to: '/', replace: true });
    } else {
      setError(result.error || 'Invalid email or password');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="space-y-4"
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-foreground">
          Work Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-9 text-xs bg-card ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        {errors.email && (
          <p id="email-error" className="text-[11px] text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <PasswordField
        id="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <p className="text-[11px] text-muted-foreground">
        Stay signed in securely on this browser.
      </p>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-9 text-xs font-semibold gap-2 shadow-xs"
      >
        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>{submitting ? 'Signing in…' : 'Sign in'}</span>
      </Button>
    </form>
  );
}
