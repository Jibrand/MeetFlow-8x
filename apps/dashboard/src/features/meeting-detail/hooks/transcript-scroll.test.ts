import { describe, expect, it, vi } from 'vitest';
import { scrollTranscriptToTurn } from './use-transcript-sync';
import { useTranscriptSync } from './use-transcript-sync';
import { act, renderHook } from '@testing-library/react';
describe('Transcript-only navigation', () => {
  it('follows playback when enabled, respects OFF, and pauses temporarily after user interaction', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    container.scrollTo = vi.fn();
    const turns = [0, 1, 2].map((index) => ({
      id: `follow-${index}`,
      speakerName: 'Speaker',
      text: 'Text',
      startTime: index * 10,
      endTime: (index + 1) * 10,
    }));
    for (const turn of turns) {
      const element = document.createElement('div');
      element.id = `turn-${turn.id}`;
      container.append(element);
    }
    const { result, rerender, unmount } = renderHook(
      ({ time }) =>
        useTranscriptSync({
          turns,
          currentTime: time,
          isPlaying: true,
          containerRef: { current: container },
        }),
      { initialProps: { time: 0 } },
    );
    expect(container.scrollTo).toHaveBeenCalledTimes(1);
    act(() => result.current.toggleAutoFollow());
    rerender({ time: 11 });
    expect(container.scrollTo).toHaveBeenCalledTimes(1);
    act(() => result.current.toggleAutoFollow());
    expect(container.scrollTo).toHaveBeenCalledTimes(2);
    act(() => result.current.handleUserScroll());
    rerender({ time: 21 });
    expect(container.scrollTo).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(6001));
    expect(container.scrollTo).toHaveBeenCalledTimes(3);
    unmount();
    container.remove();
    vi.useRealTimers();
  });
  it('scrolls only the transcript container and never invokes page-wide scrolling', () => {
    const container = document.createElement('div');
    const turn = document.createElement('div');
    turn.id = 'turn-segment';
    container.append(turn);
    document.body.append(container);
    Object.defineProperty(container, 'clientHeight', { value: 400 });
    container.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    turn.getBoundingClientRect = () => ({ top: 700, height: 80 }) as DOMRect;
    container.scrollTo = vi.fn();
    turn.scrollIntoView = vi.fn();
    scrollTranscriptToTurn(container, 'segment');
    expect(container.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 440 }),
    );
    expect(turn.scrollIntoView).not.toHaveBeenCalled();
    container.remove();
  });
});
