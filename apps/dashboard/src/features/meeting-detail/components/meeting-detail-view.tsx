import * as React from 'react';
import {
  MeetingItem,
  SummaryTemplateId,
  HighlightData,
  ActionItemData,
  MeetingClip,
  TranscriptTurnItem,
} from '../../../types/meeting';
import { getMeetingSummaryTemplates } from '../../../data/seeded-meetings';
import { useMediaPlayer } from '../hooks/use-media-player';
import {
  getMergedActionItems,
  toggleActionItemCompleted,
  updateActionItemData,
  addActionItemData,
  deleteActionItemData,
  subscribeToActionItemChanges,
} from '../lib/action-items-store';
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
import { SummaryPanel } from './summary-panel';
import { TranscriptPanel } from './transcript-panel';
import { AskMeetingPanel } from './ask-meeting-panel';
import { ActionItemsPanel } from './action-items-panel';
import { HighlightsPanel } from './highlights-panel';
import { ShareMeetingDialog } from './share-meeting-dialog';
import { ClipEditorDialog } from './clip-editor-dialog';
import { HighlightDialog } from './highlight-dialog';
import { ActionItemDialog } from './action-item-dialog';

import { FileText, AlignLeft, MessageSquare } from 'lucide-react';

export interface MeetingDetailViewProps {
  meeting: MeetingItem;
}

export function MeetingDetailView({ meeting }: MeetingDetailViewProps) {
  // 1. Templates
  const allTemplates = React.useMemo(
    () => getMeetingSummaryTemplates(meeting),
    [meeting]
  );
  const [selectedTemplateId, setSelectedTemplateId] =
    React.useState<SummaryTemplateId>('general');
  const currentTemplate = allTemplates[selectedTemplateId];

  // 2. Active Main Tab: summary | transcript | ask
  const [activeTab, setActiveTab] = React.useState<'summary' | 'transcript' | 'ask'>('summary');

  // 3. Media Player
  const player = useMediaPlayer({
    src: meeting.recordingUrl,
    initialDuration: meeting.durationSeconds,
  });

  // Range preview state for clips
  const clipEndRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (clipEndRef.current !== null && player.currentTime >= clipEndRef.current) {
      player.pause();
      clipEndRef.current = null;
    }
  }, [player.currentTime, player]);

  const handlePlayRange = (start: number, end: number) => {
    clipEndRef.current = end;
    player.seek(start);
    player.play();
  };

  // 4. Action Items Store Subscription
  const [actionItems, setActionItems] = React.useState<ActionItemData[]>(() =>
    getMergedActionItems(meeting.id)
  );

  React.useEffect(() => {
    const unsubscribe = subscribeToActionItemChanges(() => {
      setActionItems(getMergedActionItems(meeting.id));
    });
    return unsubscribe;
  }, [meeting.id]);

  // 5. Highlights Store Subscription
  const [highlights, setHighlights] = React.useState<HighlightData[]>(() =>
    getMeetingHighlights(meeting.id)
  );

  React.useEffect(() => {
    const unsubscribe = subscribeToHighlights(() => {
      setHighlights(getMeetingHighlights(meeting.id));
    });
    return unsubscribe;
  }, [meeting.id]);

  // 6. Clips Store Subscription
  const [clips, setClips] = React.useState<MeetingClip[]>(() =>
    getMeetingClips(meeting.id)
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
  const [editingHighlight, setEditingHighlight] = React.useState<HighlightData | null>(null);

  const [actionDialogOpen, setActionDialogOpen] = React.useState(false);
  const [editingActionItem, setEditingActionItem] = React.useState<ActionItemData | null>(null);

  // Keyboard shortcut listener for playback (Space)
  React.useEffect(() => {
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
  }, [player]);

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
          {/* Recording Player */}
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

            <div className="p-4 flex-1">
              {activeTab === 'summary' && (
                <SummaryPanel
                  template={currentTemplate}
                  onSeek={handleSeekAndSwitchToTranscript}
                  currentTemplateId={selectedTemplateId}
                  onSelectTemplate={setSelectedTemplateId}
                />
              )}

              {activeTab === 'transcript' && (
                <TranscriptPanel
                  turns={meeting.transcriptTurns || []}
                  currentTime={player.currentTime}
                  isPlaying={player.isPlaying}
                  onSeek={handleSeek}
                  onAddHighlightAtTurn={handleAddHighlightAtTurn}
                />
              )}

              {activeTab === 'ask' && (
                <AskMeetingPanel meeting={meeting} onSeek={handleSeek} />
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Approx 35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Items Panel */}
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <ActionItemsPanel
              items={actionItems}
              onToggleComplete={(id, val) => toggleActionItemCompleted(id, val)}
              onSeek={handleSeek}
              onOpenCreate={() => {
                setEditingActionItem(null);
                setActionDialogOpen(true);
              }}
              onEdit={(item) => {
                setEditingActionItem(item);
                setActionDialogOpen(true);
              }}
              onDelete={(id) => deleteActionItemData(id)}
            />
          </div>

          {/* Highlights & Bookmarks Panel */}
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <HighlightsPanel
              highlights={highlights}
              onSeek={handleSeek}
              onOpenCreate={() => handleOpenHighlightAtTime(player.currentTime)}
              onEdit={(hl) => {
                setEditingHighlight(hl);
                setHighlightDialogOpen(true);
              }}
              onDelete={(id) => deleteMeetingHighlight(id)}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ShareMeetingDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        meeting={meeting}
        currentTimestamp={player.currentTime}
      />

      <ClipEditorDialog
        open={clipOpen}
        onOpenChange={setClipOpen}
        meetingId={meeting.id}
        duration={player.duration}
        currentTimestamp={player.currentTime}
        clips={clips}
        onSaveClip={saveMeetingClip}
        onDeleteClip={deleteMeetingClip}
        onSeek={handleSeek}
        onPlayRange={handlePlayRange}
      />

      <HighlightDialog
        open={highlightDialogOpen}
        onOpenChange={setHighlightDialogOpen}
        meetingId={meeting.id}
        initialTimestamp={player.currentTime}
        initialHighlight={editingHighlight}
        onSave={addMeetingHighlight}
        onUpdate={updateMeetingHighlight}
      />

      <ActionItemDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        initialTimestamp={player.currentTime}
        initialItem={editingActionItem}
        onSave={addActionItemData}
        onUpdate={updateActionItemData}
      />
    </div>
  );
}
