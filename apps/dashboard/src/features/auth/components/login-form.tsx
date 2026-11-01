import * as React from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button, Input, toast } from '@meetflow/ui';
import { PasswordField } from './password-field';
import { LoginSchema } from '../schemas/auth-schemas';
import { authAdapter } from '../lib/auth-adapter';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
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
      toast.error(result.error || 'Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
    </form>
  );
}
