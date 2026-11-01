import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button, Input, toast } from '@meetflow/ui';
import { PasswordField } from './password-field';
import { RegisterSchema } from '../schemas/auth-schemas';
import { authAdapter } from '../lib/auth-adapter';
import { Loader2 } from 'lucide-react';

export function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = RegisterSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const result = await authAdapter.register(name, email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Account created! Welcome to MeetFlow.');
      navigate({ to: '/onboarding' });
    } else {
      toast.error(result.error || 'Failed to create account');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="space-y-1">
        <label htmlFor="name" className="text-xs font-medium text-foreground">
          Full Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Jibran"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`h-9 text-xs bg-card ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="reg-email" className="text-xs font-medium text-foreground">
          Work Email
        </label>
        <Input
          id="reg-email"
          type="email"
          placeholder="jibran@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-9 text-xs bg-card ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
      </div>

      <PasswordField
        id="reg-password"
        label="Password (min 8 chars, 1 number)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <PasswordField
        id="confirm-password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-9 text-xs font-semibold gap-2 shadow-xs mt-2"
      >
        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>Create workspace account</span>
      </Button>
    </form>
  );
}
