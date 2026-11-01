import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeetingStatusBadge } from './meeting-status-badge';
import { SpeakerAvatar } from './speaker-avatar';
import { TimestampLink, formatSecondsToTime } from './timestamp-link';
import { MeetingMetadata } from './meeting-metadata';
import { ActionItemRow } from './action-item-row';
import { TranscriptTurn } from './transcript-turn';
import { HighlightChip } from './highlight-chip';

describe('Meeting-Specific UI Primitives', () => {
  describe('MeetingStatusBadge', () => {
    it('renders ready status badge correctly', () => {
      render(<MeetingStatusBadge status="ready" />);
      expect(screen.getByText('Ready')).toBeDefined();
    });

    it('renders processing status badge with animation', () => {
      render(<MeetingStatusBadge status="processing" />);
      expect(screen.getByText('Processing AI')).toBeDefined();
    });

    it('renders scheduled and failed states', () => {
      const { rerender } = render(<MeetingStatusBadge status="scheduled" />);
      expect(screen.getByText('Scheduled')).toBeDefined();

      rerender(<MeetingStatusBadge status="failed" />);
      expect(screen.getByText('Failed')).toBeDefined();
    });
  });

  describe('SpeakerAvatar', () => {
    it('renders initials accurately from full name', () => {
      render(<SpeakerAvatar name="Sarah Connor" />);
      expect(screen.getByText('SC')).toBeDefined();
    });

    it('handles single-word name gracefully', () => {
      render(<SpeakerAvatar name="Jibran" />);
      expect(screen.getByText('JI')).toBeDefined();
    });
  });

  describe('TimestampLink', () => {
    it('formats seconds into MM:SS correctly', () => {
      expect(formatSecondsToTime(154)).toBe('02:34');
      expect(formatSecondsToTime(3665)).toBe('01:01:05');
    });

    it('triggers onSeek callback on click', () => {
      const seekSpy = vi.fn();
      render(<TimestampLink seconds={120} onSeek={seekSpy} />);
      const btn = screen.getByRole('button', { name: /02:00/i });
      fireEvent.click(btn);
      expect(seekSpy).toHaveBeenCalledWith(120);
    });
  });

  describe('MeetingMetadata', () => {
    it('displays formatted date, duration, and attendee count', () => {
      render(
        <MeetingMetadata
          date={new Date('2026-11-01T12:00:00Z')}
          durationSeconds={1800}
          attendeeCount={4}
        />
      );
      expect(screen.getByText(/30m/)).toBeDefined();
      expect(screen.getByText(/4 attendees/)).toBeDefined();
    });
  });

  describe('ActionItemRow', () => {
    it('renders title, checkbox, and handles toggling', () => {
      const toggleSpy = vi.fn();
      render(
        <ActionItemRow
          title="Review AI summaries"
          completed={false}
          onToggleCompleted={toggleSpy}
          priority="high"
        />
      );
      expect(screen.getByText('Review AI summaries')).toBeDefined();
      expect(screen.getByText('high')).toBeDefined();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(toggleSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('TranscriptTurn', () => {
    it('renders speaker, text, and active highlighted state', () => {
      render(
        <TranscriptTurn
          speakerName="Alex Vance"
          startTime={45}
          text="Let's ensure the transcripts are synchronized with video."
          isActive={true}
        />
      );
      expect(screen.getByText('Alex Vance')).toBeDefined();
      expect(screen.getByText('Let\'s ensure the transcripts are synchronized with video.')).toBeDefined();
    });
  });

  describe('HighlightChip', () => {
    it('renders label and handles remove callback', () => {
      const removeSpy = vi.fn();
      render(
        <HighlightChip
          label="Pricing Decision"
          tag="Decision"
          onRemove={removeSpy}
        />
      );
      expect(screen.getByText('Pricing Decision')).toBeDefined();
      expect(screen.getByText('Decision', { exact: true })).toBeDefined();

      const removeBtn = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeBtn);
      expect(removeSpy).toHaveBeenCalled();
    });
  });
});
