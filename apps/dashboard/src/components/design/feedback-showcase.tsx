import { Card, LoadingIndicator, Skeleton, EmptyState, ErrorState, toast } from '@meetflow/ui';
import { Inbox } from 'lucide-react';

export function FeedbackShowcase() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">7. Loading, Empty & Error States</h2>
        <p className="text-xs text-muted-foreground">Standardized feedback patterns for empty views and network errors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Loading Indicator */}
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <LoadingIndicator label="Transcribing audio..." />
          <div className="mt-4 w-full space-y-2">
            <Skeleton className="h-3 w-3/4 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        </Card>

        {/* Empty State */}
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title="No upcoming calls"
          description="Connect your calendar or upload an audio file to generate intelligence."
          actionLabel="Add Recording"
          onAction={() => toast.info('Recording modal triggered')}
        />

        {/* Error State */}
        <ErrorState
          title="Transcription error"
          message="The audio stream could not be decoded. Please retry."
          onRetry={() => toast.info('Retrying connection...')}
        />
      </div>
    </section>
  );
}
