import { Button, Tooltip, TooltipTrigger, TooltipContent } from '@meetflow/ui';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../providers/theme-provider';

export interface ThemeToggleButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'icon-sm';
}

const CYCLE_ORDER: Record<Theme, { next: Theme; label: string; nextLabel: string }> = {
  light: { next: 'dark', label: 'Light', nextLabel: 'Dark' },
  dark: { next: 'system', label: 'Dark', nextLabel: 'System' },
  system: { next: 'light', label: 'System', nextLabel: 'Light' },
};

export function ThemeToggleButton({ className, size = 'icon-sm' }: ThemeToggleButtonProps) {
  const { theme, setTheme } = useTheme();

  const current = CYCLE_ORDER[theme] || CYCLE_ORDER.system;

  const handleCycle = () => {
    setTheme(current.next);
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          onClick={handleCycle}
          aria-label={`Theme: ${current.label}. Click to switch to ${current.nextLabel}`}
          className={className}
        >
          <Icon className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs">
          Theme: <span className="font-semibold">{current.label}</span> (click for {current.nextLabel})
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
