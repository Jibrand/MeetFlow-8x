import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { MeetingItem } from '../../types/meeting';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  MeetingMetadata,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  toast,
} from '@meetflow/ui';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { MeetingDetailView } from './components/meeting-detail-view';
import { useProcessingPoll } from './hooks/use-processing-poll';
import { apiReprocessMeeting } from '../meetings/meetings-api';

export interface MeetingDetailScaffoldProps {
  meeting?: MeetingItem;
  meetingId: string;
  rawFilename?: string;
  sourceFormat?: string;
  onReload?: () => void;
}

export function MeetingDetailScaffold({
  meeting,
  meetingId,
  rawFilename,
  sourceFormat,
  onReload,
}: MeetingDetailScaffoldProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  // Poll when meeting status is processing
  const poll = useProcessingPoll({
    meetingId,
    enabled: meeting?.status === 'processing',
    onReady: () => {
      toast.success('Meeting intelligence extraction complete!');
      onReload?.();
    },
    onFailed: (errCode) => {
      toast.error(`Processing failed: ${errCode || 'Unknown error'}`);
      onReload?.();
    },
  });

  // 1. Unknown Meeting ID (404 state)
  if (!meeting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
          title="Meeting Not Found"
          description={`No recorded meeting exists with identifier "${meetingId}". It may have been deleted or belong to a different workspace.`}
          actionLabel="Back to Meetings"
          onAction={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  // 2. Ready Meeting -> Full Meeting Intelligence Workspace
  if (meeting.status === 'ready' || (meeting.status === 'cancelled' && meeting.summary)) {
    return (
      <MeetingDetailView
        meeting={meeting}
        rawFilename={rawFilename}
        sourceFormat={sourceFormat}
        onReload={onReload}
      />
    );
  }

  const handleRetry = async () => {
    if (isRetrying) return;
    try {
      setIsRetrying(true);
      await apiReprocessMeeting(meeting.id);
      toast.success('Reprocessing job scheduled!');
      onReload?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to retry processing');
    } finally {
      setIsRetrying(false);
    }
  };

  const platformLabel = {
    zoom: 'Zoom Call',
    meet: 'Google Meet',
    teams: 'Microsoft Teams',
    upload: 'Transcript Upload',
  }[meeting.platform] || 'Meeting';

  // Stage labels mapping for UI
  const stageLabels: Record<string, { label: string; desc: string }> = {
    QUEUED: { label: 'Queued', desc: 'Waiting in BullMQ background queue' },
    PARSING: { label: 'Parsing transcript', desc: 'Parsing speaker turns and timestamps' },
    ANALYZING: { label: 'Analyzing with AI', desc: 'Extracting executive summary, decisions, and action items' },
    FINALIZING: { label: 'Saving results', desc: 'Persisting structured intelligence to Neon database' },
    COMPLETED: { label: 'Ready', desc: 'Processing completed successfully' },
    FAILED: { label: 'Failed', desc: 'Processing encountered an error' },
  };

  const currentStageInfo = stageLabels[poll.stage] || {
    label: poll.stage,
    desc: 'Processing meeting background job',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-4 border-b border-border/60 pb-5">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Meetings</span>
          </Link>
        </div>

        {/* Title, Badges, Metadata */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <MeetingStatusBadge status={meeting.status} />
            <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
              {platformLabel}
            </Badge>
            {meeting.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {meeting.title}
          </h1>

          <MeetingMetadata
            date={meeting.startDate}
            durationSeconds={meeting.durationSeconds}
            attendeeCount={meeting.participants.length}
          />
        </div>

        {/* Participants Row */}
        {meeting.participants.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-label text-muted-foreground">Participants:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {meeting.participants.map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs text-foreground"
                >
                  <SpeakerAvatar name={p.name} size="xs" />
                  <span className="text-[11px] font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Case A: Failed Meeting */}
      {meeting.status === 'cancelled' && <EmptyState title="Meeting cancelled" description="This event was cancelled in the connected calendar." />}
      {meeting.status === 'failed' && (
        <ErrorState
          title="Meeting Recording Failed"
          message={
            poll.errorCode ||
            meeting.failureReason ||
            'Meeting processing failed. Check the processing service and retry.'
          }
          onRetry={handleRetry}
        />
      )}

      {/* Case B: Scheduled Upcoming Meeting (No Transcript) */}
      {meeting.status === 'scheduled' && (
        <Card className="border-dashed bg-muted/20">
          <CardHeader className="p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary mx-auto mb-2 shadow-2xs">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">This Meeting is Scheduled</CardTitle>
            <p className="text-xs text-muted-foreground max-w-md mx-auto pt-1 leading-relaxed">
              No transcript has been processed for this meeting. Scheduled for{' '}
              <strong className="text-foreground">
                {new Date(meeting.startDate).toLocaleString()}
              </strong>
              .
            </p>
          </CardHeader>
        </Card>
      )}

      {/* Case C: Live Background Processing with Stage Progress Bar */}
      {meeting.status === 'processing' && (
        <Card className="border border-amber-500/30 bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 animate-pulse">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">AI Intelligence In Progress</CardTitle>
              <p className="text-xs text-muted-foreground max-w-md mx-auto pt-1 leading-relaxed">
                MeetFlow is processing your transcript, extracting key takeaways, and building action items.
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-amber-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>{currentStageInfo.desc}</span>
              </div>
            </div>

            {/* Stage Progress Bar (0 - 100%) */}
            {poll.error && <p role="alert" className="text-xs text-destructive">Status updates unavailable: {poll.error}. Retrying…</p>}
            <div className="w-full space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                <span>Stage: {currentStageInfo.label}</span>
                <span className="font-mono text-amber-600 font-semibold">{poll.progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-amber-500 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.max(5, poll.progress)}%` }}
                />
              </div>
            </div>

            {/* Stages Step Indicators */}
            <div className="grid grid-cols-4 w-full gap-2 pt-1 text-[10px] text-muted-foreground">
              <div className={`p-1.5 rounded border text-center ${poll.progress >= 5 ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 font-semibold' : 'border-border/60'}`}>
                1. Queued
              </div>
              <div className={`p-1.5 rounded border text-center ${poll.progress >= 20 ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 font-semibold' : 'border-border/60'}`}>
                2. Parsing
              </div>
              <div className={`p-1.5 rounded border text-center ${poll.progress >= 45 ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 font-semibold' : 'border-border/60'}`}>
                3. Analyzing
              </div>
              <div className={`p-1.5 rounded border text-center ${poll.progress >= 85 ? 'border-amber-500/40 bg-amber-500/5 text-amber-600 font-semibold' : 'border-border/60'}`}>
                4. Saving
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
