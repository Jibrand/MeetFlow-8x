import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@meetflow/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in dashboard:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold tracking-tight">
            Something went wrong
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            We couldn’t load this view. Please try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
