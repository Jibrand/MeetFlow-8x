import { Link } from '@tanstack/react-router';
import { MeetingItem, SummaryTemplateContent } from '../../../types/meeting';
import {
  MeetingStatusBadge,
  MeetingMetadata,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@meetflow/ui';
import { ParticipantOverflow } from './participant-overflow';
import {
  ArrowLeft,
  Share2,
  Copy,
  Download,
  Scissors,
  Bookmark,
  FileText,
  FileCode,
} from 'lucide-react';
import {
  copySummaryToClipboard,
  downloadSummaryMarkdown,
  downloadTranscriptText,
} from '../lib/export-utils';

export interface MeetingHeaderProps {
  meeting: MeetingItem;
  currentTemplate: SummaryTemplateContent;
  onOpenShare: () => void;
  onOpenClip: () => void;
  onOpenHighlight: () => void;
}

export function MeetingHeader({
  meeting,
  currentTemplate,
  onOpenShare,
  onOpenClip,
  onOpenHighlight,
}: MeetingHeaderProps) {
  const platformLabel = {
    zoom: 'Zoom',
    meet: 'Google Meet',
    teams: 'Microsoft Teams',
    upload: 'Upload',
  }[meeting.platform];

  const handleCopySummary = async () => {
    await copySummaryToClipboard(meeting, currentTemplate);
  };

  const handleDownloadMarkdown = () => {
    downloadSummaryMarkdown(meeting, currentTemplate);
  };

  const handleDownloadTranscript = () => {
    downloadTranscriptText(meeting);
  };

  return (
    <div className="space-y-3.5 border-b border-border/60 pb-4">
      {/* Top Bar: Back Link + Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Meetings</span>
        </Link>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHighlight}
            className="h-8 text-xs gap-1.5"
            title="Create a highlight bookmark at current time"
          >
            <Bookmark className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Highlight</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenClip}
            className="h-8 text-xs gap-1.5"
            title="Create and preview a shareable clip snippet"
          >
            <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Create Clip</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="h-8 text-xs gap-1.5"
            title="Copy formatted markdown summary to clipboard"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Copy Notes</span>
          </Button>

          {/* Export & More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5 gap-1.5"
                title="Export notes and transcript"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDownloadMarkdown} className="text-xs gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Download Markdown (.md)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadTranscript} className="text-xs gap-2">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Download Transcript (.txt)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share Button */}
          <Button
            size="sm"
            onClick={onOpenShare}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </Button>
        </div>
      </div>

      {/* Title & Metadata Line */}
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

      {/* Participants Row with Overflow Popover */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-xs text-muted-foreground">Participants:</span>
        <ParticipantOverflow participants={meeting.participants} maxVisible={4} size="sm" />
      </div>
    </div>
  );
}
