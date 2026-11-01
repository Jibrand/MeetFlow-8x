import * as React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
} from 'lucide-react';
import { Button, Badge } from '@meetflow/ui';
import { formatSecondsToTime } from '../lib/export-utils';

export interface RecordingPlayerProps {
  isVerifiedAudio?: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (delta: number) => void;
  onSetSpeed: (speed: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
}

export function RecordingPlayer({
  isVerifiedAudio = false,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onSkip,
  onSetSpeed,
  onSetVolume,
  onToggleMute,
}: RecordingPlayerProps) {
  const progressBarRef = React.useRef<HTMLDivElement | null>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(Math.round(fraction * duration));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Audio Waveform / Visualizer Header */}
      <div className="relative flex h-14 sm:h-16 w-full items-center justify-center rounded-lg bg-secondary/50 overflow-hidden border border-border/40 select-none px-4">
        {/* Animated Sound Bars when playing */}
        <div className="flex items-center gap-1 opacity-70">
          {[40, 65, 85, 30, 95, 60, 45, 90, 75, 35, 80, 50, 70, 40, 90, 60].map(
            (height, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary/70 transition-all duration-300"
                style={{
                  height: isPlaying ? `${Math.max(12, height * (0.5 + Math.random() * 0.5))}px` : `${Math.max(8, height * 0.3)}px`,
                }}
              />
            )
          )}
        </div>

        {/* Source Badge */}
        <div className="absolute top-2 right-2">
          {isVerifiedAudio ? (
            <Badge variant="success" className="text-[10px] gap-1 px-1.5 py-0 font-medium shadow-2xs">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Verified Audio (Native HTML5)</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 text-muted-foreground font-medium">
              <Sparkles className="h-3 w-3" />
              <span>Transcript-Only Archive</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Scrub Timeline */}
      <div className="space-y-1">
        <div
          ref={progressBarRef}
          onClick={handleTimelineClick}
          className="group relative h-2.5 w-full cursor-pointer rounded-full bg-secondary/80 transition-all hover:h-3"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -mt-2 -ml-2 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-sm transition-transform scale-0 group-hover:scale-100"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-0.5 select-none">
          <span>{formatSecondsToTime(currentTime)}</span>
          <span>{formatSecondsToTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
        {/* Left: Play/Pause and Skip buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            onClick={onTogglePlay}
            className="h-8 w-8 rounded-full p-0 shadow-xs"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip(-10)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Skip back 10 seconds"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSkip(10)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Skip forward 10 seconds"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right: Speed pills & Volume */}
        <div className="flex items-center gap-2">
          {/* Playback Speed selector */}
          <div className="flex items-center rounded-md border border-border/60 bg-muted/40 p-0.5">
            {[1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => onSetSpeed(rate)}
                className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition-colors ${
                  playbackRate === rate
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              type="button"
              onClick={onToggleMute}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="h-1.5 w-14 sm:w-16 accent-primary cursor-pointer"
              title="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
