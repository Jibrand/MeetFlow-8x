import * as React from 'react';
import { Input, Button } from '@meetflow/ui';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
  error?: string;
}

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(
  (
    { label = 'Password', error, className = '', id = 'password', ...props },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          <Input
            {...props}
            id={id}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            type={visible ? 'text' : 'password'}
            className={`h-9 pr-9 text-xs bg-card ${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${className}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setVisible((prev) => !prev)}
            className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        {error && (
          <p id={`${id}-error`} className="text-[11px] text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordField.displayName = 'PasswordField';
