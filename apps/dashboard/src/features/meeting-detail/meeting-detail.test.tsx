import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithQuery as render } from '../../test-utils';
import { MeetingDetailScaffold } from './meeting-detail-scaffold';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
vi.mock('./hooks/use-processing-poll', () => ({
  useProcessingPoll: () => ({ stage: 'QUEUED', progress: 5, error: null }),
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => {
  const React = require('react');
  const Link = React.forwardRef(
    ({ children, to, className }: any, ref: any) => (
      <a ref={ref} href={to} className={className}>
        {children}
      </a>
    ),
  );
  Link.displayName = 'Link';
  return { Link, useNavigate: () => vi.fn() };
});

describe('MeetingDetailScaffold', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  it('renders 404 EmptyState when meeting does not exist', () => {
    render(
      <MeetingDetailScaffold meeting={undefined} meetingId="non-existent-id" />,
    );

    expect(screen.getByText('Meeting Not Found')).toBeDefined();
    expect(
      screen.getByText(
        /No recorded meeting exists with identifier "non-existent-id"/i,
      ),
    ).toBeDefined();
    expect(screen.getByText('Back to Meetings')).toBeDefined();
  });

  it('renders valid meeting title and Phase 04 workspace tabs for ready meetings', () => {
    const readyMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-01')!;
    render(
      <MeetingDetailScaffold
        meeting={readyMeeting}
        meetingId={readyMeeting.id}
      />,
    );

    expect(screen.getByText(readyMeeting.title)).toBeDefined();
    expect(screen.getAllByText('Sarah Connor').length).toBeGreaterThan(0);
    expect(screen.getByText('AI Summary')).toBeDefined();
    expect(screen.getByText('Transcript')).toBeDefined();
    expect(screen.getByText('Ask MeetFlow')).toBeDefined();
  });

  it('renders verified audio recording badge for verified demo meeting (meet-08)', () => {
    const verifiedMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-08')!;
    render(
      <MeetingDetailScaffold
        meeting={verifiedMeeting}
        meetingId={verifiedMeeting.id}
      />,
    );

    expect(screen.getByText('Verified Audio (Native HTML5)')).toBeDefined();
    expect(screen.getByText('0:40')).toBeDefined();
  });

  it('renders summary template selector dropdown and active template content', () => {
    const verifiedMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-08')!;
    render(
      <MeetingDetailScaffold
        meeting={verifiedMeeting}
        meetingId={verifiedMeeting.id}
      />,
    );

    // Selector is embedded in summary panel header
    expect(screen.getByText('Summary type:')).toBeDefined();
    const trigger = screen.getByRole('button', {
      name: /select summary template/i,
    });
    expect(trigger).toBeDefined();
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
  });

  it('renders transcript tab and searches transcript turns', () => {
    const verifiedMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-08')!;
    render(
      <MeetingDetailScaffold
        meeting={verifiedMeeting}
        meetingId={verifiedMeeting.id}
      />,
    );

    // Switch to Transcript tab using the tab trigger
    const transcriptTab = screen.getByRole('tab', { name: /transcript/i });
    fireEvent.click(transcriptTab);

    // Initial turns should be visible
    expect(
      screen.getByText(/This is our verified audio recording/i),
    ).toBeDefined();

    // Search query
    const searchInput = screen.getByPlaceholderText(/search transcript/i);
    fireEvent.change(searchInput, { target: { value: 'scrubbing' } });

    expect(screen.getByText(/1 of 1/i)).toBeDefined();
  });

  it('allows creating a new highlight moment', () => {
    const verifiedMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-08')!;
    render(
      <MeetingDetailScaffold
        meeting={verifiedMeeting}
        meetingId={verifiedMeeting.id}
      />,
    );

    // Open highlight dialog
    const addMomentBtn = screen.getByText('Add Moment');
    fireEvent.click(addMomentBtn);

    const titleInput = screen.getByPlaceholderText(
      /e\.g\. Approved sub-second scrubbing/i,
    );
    fireEvent.change(titleInput, {
      target: { value: 'Critical Architecture Decision' },
    });

    const submitBtn = screen.getByRole('button', { name: 'Add Highlight' });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Critical Architecture Decision')).toBeDefined();
  });

  it('renders scheduled call state with scheduling notice', () => {
    const scheduledMeeting = SEEDED_MEETINGS.find(
      (m) => m.status === 'scheduled',
    )!;
    render(
      <MeetingDetailScaffold
        meeting={scheduledMeeting}
        meetingId={scheduledMeeting.id}
      />,
    );

    expect(screen.getByText('This Meeting is Scheduled')).toBeDefined();
    expect(
      screen.getByText(/No transcript has been processed for this meeting/i),
    ).toBeDefined();
  });

  it('renders processing state notice with step breakdown', () => {
    const processingMeeting = SEEDED_MEETINGS.find(
      (m) => m.status === 'processing',
    )!;
    render(
      <MeetingDetailScaffold
        meeting={processingMeeting}
        meetingId={processingMeeting.id}
      />,
    );

    expect(screen.getByText('AI Intelligence In Progress')).toBeDefined();
    expect(
      screen.getByText(/Waiting in BullMQ background queue/i),
    ).toBeDefined();
  });

  it('renders error state and failure details when meeting processing failed', () => {
    const failedMeeting = SEEDED_MEETINGS.find((m) => m.status === 'failed')!;
    render(
      <MeetingDetailScaffold
        meeting={failedMeeting}
        meetingId={failedMeeting.id}
      />,
    );

    expect(screen.getByText('Meeting Recording Failed')).toBeDefined();
    expect(screen.getByText(failedMeeting.failureReason!)).toBeDefined();
  });
});
