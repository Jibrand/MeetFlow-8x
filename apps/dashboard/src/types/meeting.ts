export type MeetingPlatform = 'zoom' | 'meet' | 'teams' | 'upload';

export type MeetingStatus = 'ready' | 'processing' | 'scheduled' | 'failed';

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface TranscriptTurnItem {
  id: string;
  speakerName: string;
  speakerId?: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface ActionItemData {
  id: string;
  meetingId: string;
  meetingTitle?: string;
  title: string;
  assigneeName?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  timestampSeconds?: number;
}

export interface HighlightData {
  id: string;
  meetingId: string;
  label: string;
  tag: string;
  startTime: number;
  quote?: string;
}

export interface MeetingSummary {
  executiveSummary: string;
  keyTakeaways: string[];
  decisions: string[];
}

export interface MeetingItem {
  id: string;
  title: string;
  startDate: string; // ISO string
  durationSeconds: number;
  status: MeetingStatus;
  platform: MeetingPlatform;
  organizer: Participant;
  participants: Participant[];
  previewSummary: string;
  tags: string[];
  actionItemCount: number;
  highlightCount: number;
  hasRecording: boolean;
  hasTranscript: boolean;
  recordingUrl?: string;
  summary?: MeetingSummary;
  transcriptTurns?: TranscriptTurnItem[];
  actionItems?: ActionItemData[];
  highlights?: HighlightData[];
  failureReason?: string;
}
