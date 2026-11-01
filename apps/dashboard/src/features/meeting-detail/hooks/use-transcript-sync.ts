import * as React from 'react';
import { TranscriptTurnItem } from '../../../types/meeting';
import { findActiveTurnIndex } from '../lib/transcript-utils';

export interface UseTranscriptSyncOptions {
  turns: TranscriptTurnItem[];
  currentTime: number;
  isPlaying: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function useTranscriptSync({
  turns,
  currentTime,
  isPlaying,
  containerRef,
}: UseTranscriptSyncOptions) {
  const [autoFollow, setAutoFollow] = React.useState(true);
  const [userInteracted, setUserInteracted] = React.useState(false);
  const resumeTimeoutRef = React.useRef<number | null>(null);

  const activeTurnIndex = React.useMemo(() => {
    return findActiveTurnIndex(turns, currentTime);
  }, [turns, currentTime]);

  // When user manually scrolls the transcript panel, temporarily pause auto-follow
  const handleUserScroll = React.useCallback(() => {
    if (!isPlaying) return;
    setUserInteracted(true);

    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
    }

    // Auto-resume after 6 seconds of no scroll activity if autoFollow is active
    resumeTimeoutRef.current = window.setTimeout(() => {
      setUserInteracted(false);
    }, 6000);
  }, [isPlaying]);

  // Clean timeout on unmount
  React.useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll the active turn into viewport if autoFollow is enabled and user hasn't scrolled recently
  React.useEffect(() => {
    if (!autoFollow || userInteracted || activeTurnIndex < 0 || !isPlaying) return;

    const el = document.getElementById(`turn-${turns[activeTurnIndex]?.id}`);
    if (el && containerRef?.current) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeTurnIndex, autoFollow, userInteracted, isPlaying, turns, containerRef]);

  const toggleAutoFollow = React.useCallback(() => {
    setAutoFollow((prev) => !prev);
    setUserInteracted(false);
  }, []);

  return {
    activeTurnIndex,
    autoFollow,
    toggleAutoFollow,
    handleUserScroll,
    userInteracted,
  };
}
