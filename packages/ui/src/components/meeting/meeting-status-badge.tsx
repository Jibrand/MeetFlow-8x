import * as React from 'react';
import { Badge } from '../badge';
import { Calendar, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type MeetingStatusType = 'scheduled' | 'processing' | 'ready' | 'failed';

export interface MeetingStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: MeetingStatusType;
  showIcon?: boolean;
}

export function MeetingStatusBadge({
  status,
  showIcon = true,
  className,
  ...props
}: MeetingStatusBadgeProps) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge
          variant="secondary"
          className={cn('gap-1 font-medium text-[10px]', className)}
          {...props}
        >
          {showIcon && <Calendar className="h-3 w-3 opacity-70" />}
          <span>Scheduled</span>
        </Badge>
      );
    case 'processing':
      return (
        <Badge
          variant="warning"
          className={cn('gap-1 font-medium text-[10px] animate-pulse', className)}
          {...props}
        >
          {showIcon && <Clock className="h-3 w-3 opacity-80" />}
          <span>Processing AI</span>
        </Badge>
      );
    case 'ready':
      return (
        <Badge
          variant="success"
          className={cn('gap-1 font-medium text-[10px]', className)}
          {...props}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 opacity-90" />}
          <span>Ready</span>
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="destructive"
          className={cn('gap-1 font-medium text-[10px]', className)}
          {...props}
        >
          {showIcon && <AlertTriangle className="h-3 w-3 opacity-90" />}
          <span>Failed</span>
        </Badge>
      );
    default:
      return null;
  }
}
