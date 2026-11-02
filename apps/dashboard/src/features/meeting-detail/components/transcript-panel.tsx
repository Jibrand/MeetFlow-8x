import * as React from 'react';
import { scrollTranscriptToTurn } from '../hooks/use-transcript-sync';
import { TranscriptTurnItem } from '../../../types/meeting';
import { useTranscriptSync } from '../hooks/use-transcript-sync';
import {
  searchTranscript,
  splitTextWithMatches,
} from '../lib/transcript-utils';
import { Input, Button, SpeakerAvatar } from '@meetflow/ui';
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { formatSecondsToTime } from '../lib/export-utils';

export interface TranscriptPanelProps {
  turns: TranscriptTurnItem[];
  currentTime: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  seekRequest?: { time: number; request: number } | null;
  canFollow?: boolean;
  onAddHighlightAtTurn?: (turn: TranscriptTurnItem) => void;
}

export function TranscriptPanel({
  turns,
  currentTime,
  isPlaying,
  onSeek,
  onAddHighlightAtTurn,
  canFollow = false,
  seekRequest,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const { activeTurnIndex, autoFollow, toggleAutoFollow, handleUserScroll } =
    useTranscriptSync({
      turns,
      currentTime,
      isPlaying,
      containerRef,
    });

  const searchResults = React.useMemo(() => {
    return searchTranscript(turns, searchQuery);
  }, [turns, searchQuery]);

  React.useEffect(() => {
    setCurrentMatchIdx(0);
  }, [searchQuery]);

  React.useEffect(() => {
    if (!seekRequest) return;
    const turn =
      turns.find(
        (turn) =>
          turn.startTime <= seekRequest.time && turn.endTime > seekRequest.time,
      ) ??
      [...turns].reverse().find((turn) => turn.startTime <= seekRequest.time);
    if (turn) scrollTranscriptToTurn(containerRef.current, turn.id);
  }, [seekRequest, turns]);
  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % searchResults.length;
    setCurrentMatchIdx(nextIdx);
    handleUserScroll();
    const targetTurn = searchResults[nextIdx]?.turn;
    if (targetTurn) {
      scrollTranscriptToTurn(containerRef.current, targetTurn.id);
    }
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx =
      (currentMatchIdx - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIdx(prevIdx);
    handleUserScroll();
    const targetTurn = searchResults[prevIdx]?.turn;
    if (targetTurn) {
      scrollTranscriptToTurn(containerRef.current, targetTurn.id);
    }
  };

  if (!turns || turns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
        <Sparkles className="h-6 w-6 text-muted-foreground/60 mb-2" />
        <p>No transcript segments are available for this meeting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[560px] rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
      {/* Transcript Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 p-2.5">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-card"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Controls: Match counts + Follow toggle */}
        <div className="flex items-center gap-1.5">
          {searchQuery && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
              <span>
                {searchResults.length > 0
                  ? `${currentMatchIdx + 1} of ${searchResults.length}`
                  : '0 matches'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Previous match"
                onClick={handlePrevMatch}
                disabled={searchResults.length === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Next match"
                onClick={handleNextMatch}
                disabled={searchResults.length === 0}
                className="h-6 w-6 p-0"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}

          {canFollow && (
            <Button
              variant={autoFollow ? 'default' : 'outline'}
              size="sm"
              onClick={toggleAutoFollow}
              className="h-7 text-[11px] px-2.5"
              aria-pressed={autoFollow}
              title="Follow the active transcript segment during playback. Scrolling manually pauses following for six seconds."
            >
              Follow: {autoFollow ? 'On' : 'Off'}
            </Button>
          )}
        </div>
      </div>

      {/* Transcript Turns List */}
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        onPointerDown={handleUserScroll}
        onKeyDown={(event) => {
          if (
            [
              'ArrowUp',
              'ArrowDown',
              'PageUp',
              'PageDown',
              'Home',
              'End',
            ].includes(event.key)
          )
            handleUserScroll();
        }}
        className="flex-1 min-h-0 overscroll-contain overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin divide-y divide-border/20"
      >
        {turns.map((turn, idx) => {
          const isActive = idx === activeTurnIndex;
          const matchParts = splitTextWithMatches(turn.text, searchQuery);

          return (
            <div
              key={turn.id}
              id={`turn-${turn.id}`}
              onClick={() => onSeek(turn.startTime)}
              className={`group flex gap-3 rounded-lg p-2.5 transition-all cursor-pointer select-text ${
                isActive
                  ? 'bg-primary/10 border-l-3 border-l-primary shadow-2xs font-medium'
                  : 'hover:bg-muted/40'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <SpeakerAvatar name={turn.speakerName} size="sm" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {turn.speakerName}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">
                      {formatSecondsToTime(turn.startTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddHighlightAtTurn?.(turn);
                      }}
                      className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-primary"
                      title="Bookmark this moment"
                    >
                      <Bookmark className="h-2.5 w-2.5" />
                      <span>Highlight</span>
                    </Button>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-foreground/90">
                  {matchParts.map((part, pIdx) =>
                    part.isMatch ? (
                      <mark
                        key={pIdx}
                        className="bg-amber-300 dark:bg-amber-800 text-foreground font-semibold px-0.5 rounded-xs"
                      >
                        {part.text}
                      </mark>
                    ) : (
                      <span key={pIdx}>{part.text}</span>
                    ),
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
