import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SpeakerAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: 'xs' | 'sm' | 'default' | 'lg';
}

const PALETTES = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
];

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPalette(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

export function SpeakerAvatar({ name, size = 'default', className, ...props }: SpeakerAvatarProps) {
  const initials = getInitials(name);
  const colorClass = getPalette(name);

  const sizeClasses = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-6 w-6 text-[10px]',
    default: 'h-7 w-7 text-[11px]',
    lg: 'h-8 w-8 text-xs',
  }[size];

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold select-none transition-transform',
        sizeClasses,
        colorClass,
        className
      )}
      title={name}
      {...props}
    >
      <span>{initials}</span>
    </div>
  );
}
