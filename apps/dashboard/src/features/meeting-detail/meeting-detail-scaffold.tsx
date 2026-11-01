import { Link } from '@tanstack/react-router';
import { MeetingItem } from '../../types/meeting';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  MeetingMetadata,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  EmptyState,
  ErrorState,
  ActionItemRow,
  toast,
} from '@meetflow/ui';
import {
  ArrowLeft,
  Share2,
  Calendar,
  Sparkles,
  PlayCircle,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react';

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

  const platformLabel = {
    zoom: 'Zoom Call',
    meet: 'Google Meet',
    teams: 'Microsoft Teams',
    upload: 'Uploaded Audio',
  }[meeting.platform];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-4 border-b border-border/60 pb-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Meetings</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success('Share link copied to clipboard!');
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </Button>
          </div>
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

      {/* 2. State-Specific Content Panels */}

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

      {/* Case D: Ready Meeting (Workspace Scaffold Preview) */}
      {meeting.status === 'ready' && (
        <div className="space-y-6">
          {/* Phase 04 Reserved Workspace Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Meeting Intelligence Workspace Scaffold (Phase 03)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  The complete interactive media player, synchronized transcript scrubber, and summary template switcher are arriving in Phase 04.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info('Media playback engine initialized for Phase 04')}
              className="h-8 gap-1.5 text-xs shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Preview Player Stub</span>
            </Button>
          </div>

          {/* Seeded Summary Preview Card */}
          {meeting.summary && (
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-semibold">Executive Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p className="text-foreground/90 font-medium">{meeting.summary.executiveSummary}</p>
                {meeting.summary.keyTakeaways.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-label text-muted-foreground">Key Takeaways</span>
                    <ul className="list-disc pl-4 space-y-1 text-foreground/80">
                      {meeting.summary.keyTakeaways.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seeded Action Items */}
          {meeting.actionItems && meeting.actionItems.length > 0 && (
            <div className="space-y-2">
              <span className="text-label text-muted-foreground">Action Items</span>
              <div className="space-y-2">
                {meeting.actionItems.map((action) => (
                  <ActionItemRow
                    key={action.id}
                    title={action.title}
                    completed={action.completed}
                    assigneeName={action.assigneeName}
                    dueDate={action.dueDate}
                    priority={action.priority}
                    timestampSeconds={action.timestampSeconds}
                    onSeek={(s) => toast.info(`Scrubbing to ${s}s`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
