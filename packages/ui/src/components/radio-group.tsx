import * as React from 'react';
import { Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, name, value: controlledValue, defaultValue, onValueChange, disabled, children, ...props }, ref) => {
    const isControlled = controlledValue !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const value = isControlled ? controlledValue : uncontrolledValue;

    const onChange = React.useCallback(
      (newVal: string) => {
        if (!isControlled) {
          setUncontrolledValue(newVal);
        }
        onValueChange?.(newVal);
      },
      [isControlled, onValueChange]
    );

    return (
      <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
        <div ref={ref} role="radiogroup" className={cn('grid gap-2', className)} {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, disabled: itemDisabled, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const isChecked = context.value === value;
    const disabled = itemDisabled || context.disabled;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={() => !disabled && context.onChange?.(value)}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center transition-colors',
          isChecked && 'border-primary',
          className
        )}
        {...props}
      >
        {isChecked && <Circle className="h-2 w-2 fill-current text-current" />}
      </button>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';
