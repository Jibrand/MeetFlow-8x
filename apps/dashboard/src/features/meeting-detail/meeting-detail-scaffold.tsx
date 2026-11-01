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
import { ArrowLeft, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { MeetingDetailView } from './components/meeting-detail-view';

export interface MeetingDetailScaffoldProps {
  meeting?: MeetingItem;
  meetingId: string;
}

export function MeetingDetailScaffold({ meeting, meetingId }: MeetingDetailScaffoldProps) {
  // 1. Unknown Meeting ID (404 state)
  if (!meeting) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
          title="Meeting Not Found"
          description={`No recorded meeting exists with identifier "${meetingId}". It may have been deleted or the link is expired.`}
          actionLabel="Back to Meetings"
          onAction={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  // 2. Ready Meeting -> Full Meeting Intelligence Workspace
  if (meeting.status === 'ready') {
    return <MeetingDetailView meeting={meeting} />;
  }

  const platformLabel = {
    zoom: 'Zoom Call',
    meet: 'Google Meet',
    teams: 'Microsoft Teams',
    upload: 'Uploaded Audio',
  }[meeting.platform];

  // 3. Non-Ready States (scheduled, processing, failed)
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
      </div>

      {/* Case A: Failed Meeting */}
      {meeting.status === 'failed' && (
        <ErrorState
          title="Meeting Recording Failed"
          message={
            meeting.failureReason ||
            'The audio stream was disrupted before completion. Transcripts could not be generated.'
          }
          onRetry={() => toast.info('Recording retry triggered')}
        />
      )}

      {/* Case B: Scheduled Upcoming Meeting */}
      {meeting.status === 'scheduled' && (
        <Card className="border-dashed bg-muted/20">
          <CardHeader className="p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary mx-auto mb-2 shadow-2xs">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">This Meeting is Scheduled</CardTitle>
            <p className="text-xs text-muted-foreground max-w-md mx-auto pt-1 leading-relaxed">
              Recording and automated AI note taking will begin when the call starts on{' '}
              <strong className="text-foreground">
                {new Date(meeting.startDate).toLocaleString()}
              </strong>
              .
            </p>
          </CardHeader>
        </Card>
      )}

      {/* Case C: Processing Meeting */}
      {meeting.status === 'processing' && (
        <Card className="border bg-card shadow-xs">
          <CardHeader className="p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 mx-auto mb-3 animate-pulse">
              <Clock className="h-5 w-5" />
            </div>
            <CardTitle className="text-sm font-semibold">AI Intelligence In Progress</CardTitle>
            <p className="text-xs text-muted-foreground max-w-md mx-auto pt-1 leading-relaxed">
              MeetFlow is currently processing the recording with multi-speaker diarization, extracting key takeaways, and building action items.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>Generating synchronized timestamps...</span>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
