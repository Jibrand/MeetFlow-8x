import * as React from 'react';
import {
  MeetingItem,
  SummaryTemplateId,
  SummaryTemplateContent,
  HighlightData,
  ActionItemData,
  MeetingClip,
  TranscriptTurnItem,
} from '../../../types/meeting';
import { getMeetingSummaryTemplates } from '../lib/summary-templates';
import { toast } from '@meetflow/ui';
import { useMediaPlayer } from '../hooks/use-media-player';
import {
  getMeetingHighlights,
  addMeetingHighlight,
  updateMeetingHighlight,
  deleteMeetingHighlight,
  subscribeToHighlights,
} from '../lib/highlights-store';
import {
  getMeetingClips,
  saveMeetingClip,
  deleteMeetingClip,
  subscribeToClips,
} from '../lib/clips-store';

import { MeetingHeader } from './meeting-header';
import { RecordingPlayer } from './recording-player';
import { TranscriptSourceCard } from './transcript-source-card';
import { SummaryPanel } from './summary-panel';
import { TranscriptPanel } from './transcript-panel';
import { AskMeetingPanel } from './ask-meeting-panel';
import { ActionItemsPanel } from './action-items-panel';
import { HighlightsPanel } from './highlights-panel';
import { ShareMeetingDialog } from './share-meeting-dialog';
import { ClipEditorDialog } from './clip-editor-dialog';
import { HighlightDialog } from './highlight-dialog';
import { ActionItemDialog } from './action-item-dialog';
import {
  apiUpdateActionItem,
  apiCreateActionItem,
  apiDeleteActionItem,
} from '../../meetings/meetings-api';

import { FileText, AlignLeft, MessageSquare } from 'lucide-react';

export interface MeetingDetailViewProps {
  meeting: MeetingItem;
  rawFilename?: string;
  sourceFormat?: string;
  onReload?: () => void;
}

export function MeetingDetailView({
  meeting,
  rawFilename,
  sourceFormat,
  onReload,
}: MeetingDetailViewProps) {
  // 1. Templates
  const allTemplates = React.useMemo(
    () => getMeetingSummaryTemplates(meeting),
    [meeting],
  );
  const [selectedTemplateId, setSelectedTemplateId] =
    React.useState<SummaryTemplateId>('general');

  const defaultTemplate: SummaryTemplateContent = {
    templateId: 'general',
    label: 'General',
    description: 'Standard meeting synthesis',
    sections: [],
  };
  const currentTemplate =
    allTemplates[selectedTemplateId] ||
    allTemplates['general'] ||
    defaultTemplate;

  // 2. Active Main Tab: summary | transcript | ask
  const [activeTab, setActiveTab] = React.useState<
    'summary' | 'transcript' | 'ask'
  >('summary');

  // 3. Media Player (only actively initialized if media source exists)
  const player = useMediaPlayer({
    src: meeting.recordingUrl,
    initialDuration: meeting.durationSeconds,
  });

  // Range preview state for clips
  const clipEndRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (
      clipEndRef.current !== null &&
      player.currentTime >= clipEndRef.current
    ) {
      player.pause();
      clipEndRef.current = null;
    }
  }, [player.currentTime, player]);

  const handlePlayRange = (start: number, end: number) => {
    clipEndRef.current = end;
    player.seek(start);
    player.play();
  };

  // 4. Action Items Store Subscription & Database Sync
  const [actionItems, setActionItems] = React.useState<ActionItemData[]>(
    meeting.actionItems ?? [],
  );

  React.useEffect(() => {
    setActionItems(meeting.actionItems ?? []);
  }, [meeting.id, meeting.actionItems]);

  // 5. Highlights Store Subscription
  const [highlights, setHighlights] = React.useState<HighlightData[]>(() =>
    getMeetingHighlights(meeting.id, meeting.highlights ?? []),
  );

  React.useEffect(() => {
    const sync = () =>
      setHighlights(getMeetingHighlights(meeting.id, meeting.highlights ?? []));
    sync();
    return subscribeToHighlights(sync);
  }, [meeting.id, meeting.highlights]);

  // 6. Clips Store Subscription
  const [clips, setClips] = React.useState<MeetingClip[]>(() =>
    getMeetingClips(meeting.id),
  );

  React.useEffect(() => {
    const unsubscribe = subscribeToClips(() => {
      setClips(getMeetingClips(meeting.id));
    });
    return unsubscribe;
  }, [meeting.id]);

  // 7. Dialog States
  const [shareOpen, setShareOpen] = React.useState(false);
  const [clipOpen, setClipOpen] = React.useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = React.useState(false);
  const [editingHighlight, setEditingHighlight] =
    React.useState<HighlightData | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [editingActionItem, setEditingActionItem] =
    React.useState<ActionItemData | null>(null);

  // Keyboard shortcut listener for playback (Space) only when player has a valid recording
  React.useEffect(() => {
    if (!meeting.recordingUrl) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        player.togglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [player, meeting.recordingUrl]);

  // Shared seek interaction
  const handleSeek = (seconds: number) => {
    player.seek(seconds);
  };

  const handleSeekAndSwitchToTranscript = (seconds: number) => {
    player.seek(seconds);
    setActiveTab('transcript');
  };

  const handleOpenHighlightAtTime = (_time?: number) => {
    setEditingHighlight(null);
    setHighlightDialogOpen(true);
  };

  const handleAddHighlightAtTurn = (turn: TranscriptTurnItem) => {
    setEditingHighlight(null);
    addMeetingHighlight({
      meetingId: meeting.id,
      label: `Highlight by ${turn.speakerName}`,
      tag: 'Important',
      startTime: turn.startTime,
      quote: turn.text,
    });
  };

  const handleToggleActionItem = async (id: string, completed: boolean) => {
    try {
      const updated = await apiUpdateActionItem(id, {
        status: completed ? 'DONE' : 'TODO',
      });
      setActionItems((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to update action item.',
      );
    }
  };

  const handleDeleteActionItem = async (id: string) => {
    try {
      await apiDeleteActionItem(id);
      setActionItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to delete action item.',
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Meeting Header */}
      <MeetingHeader
        meeting={meeting}
        currentTemplate={currentTemplate}
        onOpenShare={() => setShareOpen(true)}
        onOpenClip={() => setClipOpen(true)}
        onOpenHighlight={() => handleOpenHighlightAtTime(player.currentTime)}
      />

      {/* 2. Responsive 2-Column Workspace (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Approx 65%) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Source-Aware Card vs Recording Player */}
          {meeting.hasRecording && meeting.recordingUrl ? (
            <RecordingPlayer
              videoSrc={meeting.videoUrl}
              isVerifiedAudio={meeting.isVerifiedAudio}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              playbackRate={player.playbackRate}
              volume={player.volume}
              isMuted={player.isMuted}
              onTogglePlay={player.togglePlay}
              onSeek={handleSeek}
              onSkip={player.skip}
              onSetSpeed={player.setSpeed}
              onSetVolume={player.setVolume}
              onToggleMute={player.toggleMute}
            />
          ) : (
            <TranscriptSourceCard
              meeting={meeting}
              rawFilename={rawFilename}
              sourceFormat={sourceFormat}
              onReprocessTriggered={onReload}
            />
          )}

          {/* Primary Content Tabs: Summary | Transcript | Ask AI */}
          <div className="w-full rounded-xl border border-border bg-card shadow-xs overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3.5 py-2.5">
              <div className="inline-flex h-8 items-center justify-center rounded-lg bg-secondary/80 p-1 text-muted-foreground">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'summary'}
                  onClick={() => setActiveTab('summary')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all gap-1.5 select-none ${
                    activeTab === 'summary'
                      ? 'bg-card text-primary font-semibold shadow-2xs'
                      : 'hover:text-foreground'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>AI Summary</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'transcript'}
                  onClick={() => setActiveTab('transcript')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all gap-1.5 select-none ${
                    activeTab === 'transcript'
                      ? 'bg-card text-primary font-semibold shadow-2xs'
                      : 'hover:text-foreground'
                  }`}
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                  <span>Transcript</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                    {meeting.transcriptTurns?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'ask'}
                  onClick={() => setActiveTab('ask')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-all gap-1.5 select-none ${
                    activeTab === 'ask'
                      ? 'bg-card text-primary font-semibold shadow-2xs'
                      : 'hover:text-foreground'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Ask MeetFlow</span>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === 'summary' && (
                <SummaryPanel
                  template={currentTemplate}
                  currentTemplateId={selectedTemplateId}
                  onSelectTemplate={setSelectedTemplateId}
                  onSeek={handleSeekAndSwitchToTranscript}
                />
              )}

              {activeTab === 'transcript' && (
                <TranscriptPanel
                  turns={meeting.transcriptTurns ?? []}
                  isPlaying={player.isPlaying}
                  currentTime={player.currentTime}
                  onSeek={handleSeek}
                  onAddHighlightAtTurn={handleAddHighlightAtTurn}
                />
              )}

              {activeTab === 'ask' && (
                <AskMeetingPanel
                  meeting={meeting}
                  onSeek={handleSeekAndSwitchToTranscript}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Approx 35%) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Action Items Panel */}
          <ActionItemsPanel
            items={actionItems}
            onSeek={handleSeek}
            onToggleComplete={handleToggleActionItem}
            onEdit={(item) => {
              setEditingActionItem(item);
              setActionDialogOpen(true);
            }}
            onDelete={handleDeleteActionItem}
            onOpenCreate={() => {
              setEditingActionItem(null);
              setActionDialogOpen(true);
            }}
          />

          {/* Highlights & Moments Panel */}
          <HighlightsPanel
            highlights={highlights}
            onSeek={handleSeek}
            onEdit={(hl) => {
              setEditingHighlight(hl);
              setHighlightDialogOpen(true);
            }}
            onDelete={(id) => deleteMeetingHighlight(id)}
            onOpenCreate={() => handleOpenHighlightAtTime(player.currentTime)}
          />
        </div>
      </div>

      {/* Share Dialog */}
      <ShareMeetingDialog
        meeting={meeting}
        currentTimestamp={player.currentTime}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* Clip Editor Dialog */}
      <ClipEditorDialog
        open={clipOpen}
        onOpenChange={setClipOpen}
        meetingId={meeting.id}
        duration={player.duration}
        currentTimestamp={player.currentTime}
        clips={clips}
        onDeleteClip={deleteMeetingClip}
        onSeek={handleSeek}
        onPlayRange={handlePlayRange}
        onSaveClip={(newClip) => saveMeetingClip(newClip)}
      />

      {/* Highlight Dialog */}
      <HighlightDialog
        open={highlightDialogOpen}
        onOpenChange={setHighlightDialogOpen}
        meetingId={meeting.id}
        initialTimestamp={player.currentTime}
        initialHighlight={editingHighlight}
        onUpdate={updateMeetingHighlight}
        onSave={(data) => {
          if (editingHighlight) {
            updateMeetingHighlight(editingHighlight.id, data);
          } else {
            addMeetingHighlight({
              meetingId: meeting.id,
              label: data.label,
              tag: data.tag,
              startTime: data.startTime,
              quote: data.quote,
            });
          }
        }}
      />

      {/* Action Item Dialog */}
      <ActionItemDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        initialItem={editingActionItem}
        onSave={async (data) => {
          if (editingActionItem) {
            const updated = await apiUpdateActionItem(editingActionItem.id, {
              title: data.title,
              assigneeName: data.assigneeName,
              dueDate: data.dueDate
                ? new Date(data.dueDate).toISOString()
                : null,
            });
            setActionItems((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item)),
            );
          } else {
            const created = await apiCreateActionItem({
              meetingId: meeting.id,
              title: data.title,
              assigneeName: data.assigneeName,
              dueDate: data.dueDate
                ? new Date(data.dueDate).toISOString()
                : null,
              status: 'TODO',
            });
            setActionItems((prev) => [created, ...prev]);
          }
        }}
      />
    </div>
  );
}
