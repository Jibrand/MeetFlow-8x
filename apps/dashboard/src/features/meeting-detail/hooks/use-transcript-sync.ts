import * as React from 'react';
import { TranscriptTurnItem } from '../../../types/meeting';
import { findActiveTurnIndex } from '../lib/transcript-utils';

export function scrollTranscriptToTurn(
  container: HTMLDivElement | null,
  id: string,
) {
  const element = document.getElementById('turn-' + id);
  if (!container || !element || !container.contains(element)) return;
  const bounds = container.getBoundingClientRect();
  const target = element.getBoundingClientRect();
  container.scrollTo({
    top:
      container.scrollTop +
      target.top -
      bounds.top -
      (container.clientHeight - target.height) / 2,
    behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
  });
}
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
    if (!autoFollow || userInteracted || activeTurnIndex < 0 || !isPlaying)
      return;

    scrollTranscriptToTurn(
      containerRef?.current ?? null,
      turns[activeTurnIndex]?.id ?? '',
    );
  }, [
    activeTurnIndex,
    autoFollow,
    userInteracted,
    isPlaying,
    turns,
    containerRef,
  ]);

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
