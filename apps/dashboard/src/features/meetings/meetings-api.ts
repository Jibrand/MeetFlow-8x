import {
  apiClient,
  ApiError,
  API_BASE_URL,
  processingFailureMessage,
} from '../../lib/api-client';
import {
  MeetingItem,
  ActionItemData,
  MeetingStatus,
} from '../../types/meeting';

export interface BackendMeetingParticipant {
  id: string;
  meetingId: string;
  name: string;
  email?: string | null;
  role?: string | null;
}

export interface BackendTranscriptTurn {
  id: string;
  sequence: number;
  speakerName?: string | null;
  startMs?: number | null;
  endMs?: number | null;
  text: string;
}

export interface BackendActionItem {
  projectId?: string;
  priority?: string;
  version?: number;
  id: string;
  workspaceId: string;
  meetingId?: string | null;
  meetingTitle?: string | null;
  title: string;
  description?: string | null;
  assigneeName?: string | null;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  source: 'MANUAL' | 'AI_EXTRACTED';
  createdAt: string;
  updatedAt: string;
}

export interface BackendMeetingSummary {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  topics: string[];
  highlights?: Array<{ label: string; quote: string; tag: string }>;
  model?: string;
}

export interface BackendProcessingJob {
  stage: string;
  progress: number;
  attempts: number;
  errorCode?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BackendMeeting {
  projectId: string;
  project?: {
    id: string;
    name: string;
    companyId: string;
    needsReview: boolean;
    company: { id: string; name: string };
  };
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  timezone: string;
  meetingStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  processingStatus:
    | 'NOT_STARTED'
    | 'QUEUED'
    | 'PARSING'
    | 'ANALYZING'
    | 'FINALIZING'
    | 'READY'
    | 'FAILED';
  sourceType:
    | 'MANUAL'
    | 'TRANSCRIPT_UPLOAD'
    | 'AUDIO_UPLOAD'
    | 'VIDEO_UPLOAD'
    | 'CALENDAR';
  durationSeconds: number;
  recordingUrl?: string | null;
  participants: BackendMeetingParticipant[];
  summary?: BackendMeetingSummary | null;
  actionItems?: BackendActionItem[];
  segments?: BackendTranscriptTurn[];
  transcripts?: Array<{
    id: string;
    sourceFilename: string;
    sourceFormat: string;
    createdAt: string;
  }>;
  processingJobs?: BackendProcessingJob[];
  actionItemCount?: number;
  segmentCount?: number;
  hasTranscript?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingStatusResponse {
  meetingId: string;
  processingStatus: BackendMeeting['processingStatus'];
  stage: string;
  progress: number;
  attempts: number;
  errorCode?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface OverviewStatsResponse {
  totalMeetings: number;
  recordedMeetings: number;
  totalHours: number;
  openActionItems: number;
  completedActionItems: number;
  overdueActionItems: number;
  recentMeetings: BackendMeeting[];
  attentionItems: BackendActionItem[];
}

/**
 * Maps Backend Meeting to Frontend MeetingItem
 */
export function mapBackendMeetingToItem(m: BackendMeeting): MeetingItem {
  // Map processing status to UI status
  let status: MeetingStatus = 'scheduled';
  if (m.meetingStatus === 'CANCELLED') {
    status = 'cancelled';
  } else if (m.processingStatus === 'READY') {
    status = 'ready';
  } else if (m.processingStatus === 'FAILED') {
    status = 'failed';
  } else if (
    ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'].includes(
      m.processingStatus,
    )
  ) {
    status = 'processing';
  } else {
    status = 'scheduled';
  }

  const turns = (m.segments || []).map((seg) => ({
    id: seg.id,
    speakerName: seg.speakerName || 'Speaker',
    startTime:
      seg.startMs !== null && seg.startMs !== undefined
        ? seg.startMs / 1000
        : 0,
    endTime:
      seg.endMs !== null && seg.endMs !== undefined ? seg.endMs / 1000 : 0,
    text: seg.text,
  }));

  const actionItems: ActionItemData[] = (m.actionItems || []).map((a) => ({
    id: a.id,
    meetingId: m.id,
    meetingTitle: m.title,
    title: a.title,
    assigneeName: a.assigneeName || undefined,
    dueDate: a.dueDate || undefined,
    projectId: a.projectId,
    priority:
      (a.priority?.toLowerCase() as 'low' | 'medium' | 'high') || 'medium',
    completed: a.status === 'DONE',
  }));

  const highlights = (m.summary?.highlights || []).map((h, idx) => ({
    id: `hl-${m.id}-${idx}`,
    meetingId: m.id,
    label: h.label,
    tag: h.tag,
    startTime: 0,
    quote: h.quote,
  }));

  const hasRecording = Boolean(m.recordingUrl);
  const recordingUrl = m.recordingUrl?.startsWith('/')
    ? `${API_BASE_URL.replace(/\/api(?:\/v1)?\/?$/, '')}${m.recordingUrl}`
    : m.recordingUrl || undefined;
  const hasTranscript =
    Boolean(m.hasTranscript) ||
    Boolean(m.transcripts && m.transcripts.length > 0) ||
    turns.length > 0 ||
    m.sourceType === 'TRANSCRIPT_UPLOAD';

  return {
    id: m.id,
    projectId: m.projectId,
    project: m.project,
    title: m.title,
    startDate: m.startAt,
    durationSeconds: m.durationSeconds ?? 0,
    status,
    platform: ['TRANSCRIPT_UPLOAD', 'AUDIO_UPLOAD', 'VIDEO_UPLOAD'].includes(
      m.sourceType,
    )
      ? 'upload'
      : 'meet',
    organizer: {
      id: m.participants?.[0]?.id || '',
      name: m.participants?.[0]?.name || 'Organizer unavailable',
      email: m.participants?.[0]?.email || '',
    },
    participants: (m.participants || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email || '',
      role: p.role || undefined,
    })),
    previewSummary:
      m.summary?.overview || m.description || 'No transcript processed yet.',
    tags: m.summary?.topics || [],
    actionItemCount: m.actionItemCount ?? actionItems.length,
    highlightCount: highlights.length,
    hasRecording,
    hasTranscript,
    recordingUrl,
    videoUrl: m.sourceType === 'VIDEO_UPLOAD' ? recordingUrl : undefined,
    summary: m.summary
      ? {
          executiveSummary: m.summary.overview,
          keyTakeaways: m.summary.keyPoints || [],
          decisions: m.summary.decisions || [],
        }
      : undefined,
    transcriptTurns: turns,
    actionItems,
    highlights,
    failureReason: m.processingJobs?.[0]?.errorCode
      ? processingFailureMessage(m.processingJobs[0].errorCode)
      : undefined,
  };
}

/**
 * Maps Backend Action Item to ActionItemData
 */
export function mapBackendActionItem(a: BackendActionItem): ActionItemData {
  return {
    id: a.id,
    meetingId: a.meetingId || '',
    meetingTitle: a.meetingTitle || undefined,
    title: a.title,
    assigneeName: a.assigneeName || undefined,
    dueDate: a.dueDate || undefined,
    priority: 'medium',
    completed: a.status === 'DONE',
  };
}

// ==============================================================================
// API Client Functions
// ==============================================================================

export async function apiFetchMeetings(
  params?: {
    status?: string;
    processingStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
    projectId?: string;
    companyId?: string;
    viewStatus?: string;
    platform?: string;
    sort?: string;
  },
  signal?: AbortSignal,
): Promise<{ meetings: MeetingItem[]; total: number }> {
  const query = new URLSearchParams();
  for (const key of [
    'viewStatus',
    'platform',
    'sort',
    'projectId',
    'companyId',
  ] as const)
    if (params?.[key]) query.set(key, params[key]);
  if (params?.status) query.set('status', params.status);
  if (params?.processingStatus)
    query.set('processingStatus', params.processingStatus);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const meetings: MeetingItem[] = [];
  let page = params?.page ?? 1;
  let total = 0;
  query.set('limit', String(params?.limit ?? 100));
  do {
    query.set('page', String(page));
    const res = await apiClient<{
      meetings: BackendMeeting[];
      pagination: { total: number; totalPages: number };
    }>(`/meetings?${query.toString()}`, { signal });
    const seen = new Set(meetings.map((meeting) => meeting.id));
    meetings.push(
      ...res.meetings
        .filter((meeting) => !seen.has(meeting.id))
        .map(mapBackendMeetingToItem),
    );
    total = res.pagination.total;
    if (
      params?.page ||
      page >= res.pagination.totalPages ||
      res.meetings.length === 0
    )
      break;
    page += 1;
  } while (meetings.length < total);
  return { meetings, total };
}

export async function apiFetchMeeting(
  id: string,
  signal?: AbortSignal,
): Promise<{ meeting: MeetingItem; raw: BackendMeeting }> {
  const res = await apiClient<BackendMeeting>(`/meetings/${id}`, { signal });
  return {
    meeting: mapBackendMeetingToItem(res),
    raw: res,
  };
}

export async function apiCreateMeeting(data: {
  projectId: string;
  companyId?: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  timezone?: string;
  meetingStatus?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  sourceType?: 'MANUAL' | 'TRANSCRIPT_UPLOAD';
  participants?: Array<{ name: string; email?: string; role?: string }>;
  transcript?: {
    rawText: string;
    sourceFilename: string;
    sourceFormat: 'txt' | 'srt' | 'vtt';
  } | null;
}): Promise<MeetingItem> {
  const res = await apiClient<BackendMeeting>('/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapBackendMeetingToItem(res);
}

export async function apiFetchProcessingStatus(
  id: string,
): Promise<ProcessingStatusResponse> {
  return apiClient<ProcessingStatusResponse>(`/meetings/${id}/processing`);
}

export async function apiCreateMediaMeeting(
  file: File,
  metadata: Parameters<typeof apiCreateMeeting>[0],
): Promise<MeetingItem> {
  const body = new FormData();
  body.append('file', file);
  body.append('metadata', JSON.stringify(metadata));
  const result = await apiClient<BackendMeeting>('/meetings/media', {
    method: 'POST',
    body,
    timeoutMs: 120_000,
  });
  return mapBackendMeetingToItem(result);
}

export async function apiReprocessMeeting(id: string): Promise<void> {
  const result = await apiClient<{ queueStatus: string }>(
    `/meetings/${id}/reprocess`,
    {
      method: 'POST',
    },
  );
  if (result.queueStatus === 'REDIS_UNAVAILABLE') {
    throw new ApiError(503, {
      code: 'REDIS_UNAVAILABLE',
      message: 'Processing could not be queued. Restore Redis and retry.',
    });
  }
}

export async function apiUpdateMeeting(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    startAt?: string;
    endAt?: string | null;
    timezone?: string;
    participants?: Array<{
      name: string;
      email?: string | null;
      role?: string | null;
    }>;
  },
): Promise<BackendMeeting> {
  return apiClient(`/meetings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
export async function apiDeleteMeeting(id: string): Promise<void> {
  await apiClient(`/meetings/${id}`, { method: 'DELETE' });
}

export async function apiFetchActionItems(
  params?: {
    meetingId?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    search?: string;
    projectId?: string;
    companyId?: string;
  },
  signal?: AbortSignal,
): Promise<ActionItemData[]> {
  const query = new URLSearchParams();
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.companyId) query.set('companyId', params.companyId);
  if (params?.meetingId) query.set('meetingId', params.meetingId);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  query.set('limit', '100');
  const items: ActionItemData[] = [];
  let page = 1;
  for (;;) {
    query.set('page', String(page));
    const res = await apiClient<{
      actionItems: BackendActionItem[];
      pagination: { totalPages: number };
    }>(`/action-items?${query.toString()}`, { signal });
    items.push(...res.actionItems.map(mapBackendActionItem));
    if (page >= res.pagination.totalPages || res.actionItems.length === 0)
      break;
    page += 1;
  }
  return items;
}

export async function apiCreateActionItem(data: {
  meetingId?: string | null;
  title: string;
  description?: string | null;
  assigneeName?: string | null;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  status?: BackendActionItem['status'];
}): Promise<ActionItemData> {
  const res = await apiClient<BackendActionItem>('/action-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return mapBackendActionItem(res);
}

export async function apiUpdateActionItem(
  id: string,
  data: {
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    title?: string;
    description?: string;
    assigneeName?: string;
    dueDate?: string | null;
  },
): Promise<ActionItemData> {
  const res = await apiClient<BackendActionItem>(`/action-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return mapBackendActionItem(res);
}

export async function apiDeleteActionItem(id: string): Promise<void> {
  await apiClient(`/action-items/${id}`, {
    method: 'DELETE',
  });
}

export async function apiFetchOverviewStats(
  signal?: AbortSignal,
  scope?: { projectId?: string; companyId?: string },
): Promise<OverviewStatsResponse> {
  const query = new URLSearchParams();
  if (scope?.projectId) query.set('projectId', scope.projectId);
  if (scope?.companyId) query.set('companyId', scope.companyId);
  return apiClient<OverviewStatsResponse>('/meetings/overview?' + query, {
    signal,
  });
}
