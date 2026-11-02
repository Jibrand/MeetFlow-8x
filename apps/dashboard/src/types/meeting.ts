export type MeetingPlatform = 'zoom' | 'meet' | 'teams' | 'upload';

export type MeetingStatus = 'ready' | 'processing' | 'scheduled' | 'failed' | 'cancelled';

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
  tag: 'Important' | 'Decision' | 'Action Item' | 'Question' | 'Customer Insight' | string;
  startTime: number;
  quote?: string;
}

export type SummaryTemplateId =
  | 'general'
  | 'executive'
  | 'sales'
  | 'product'
  | 'engineering'
  | 'interview';

export interface SummaryEvidenceItem {
  text: string;
  timestampSeconds?: number;
  speakerName?: string;
}

export interface SummarySection {
  title: string;
  items: SummaryEvidenceItem[];
}

export interface SummaryTemplateContent {
  templateId: SummaryTemplateId;
  label: string;
  description: string;
  sections: SummarySection[];
}

export interface MeetingSummary {
  executiveSummary: string;
  keyTakeaways: string[];
  decisions: string[];
  templates?: Partial<Record<SummaryTemplateId, SummaryTemplateContent>>;
}

export interface MeetingClip {
  id: string;
  meetingId: string;
  title: string;
  startTime: number;
  endTime: number;
  createdAt: string;
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
  isVerifiedAudio?: boolean;
  videoUrl?: string;
  hasVideo?: boolean;
  summary?: MeetingSummary;
  transcriptTurns?: TranscriptTurnItem[];
  actionItems?: ActionItemData[];
  highlights?: HighlightData[];
  clips?: MeetingClip[];
  failureReason?: string;
}
