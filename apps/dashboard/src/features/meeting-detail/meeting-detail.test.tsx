import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeetingDetailScaffold } from './meeting-detail-scaffold';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => {
  const React = require('react');
  const Link = React.forwardRef(({ children, to, className }: any, ref: any) => (
    <a ref={ref} href={to} className={className}>
      {children}
    </a>
  ));
  Link.displayName = 'Link';
  return { Link };
});

describe('MeetingDetailScaffold', () => {
  it('renders 404 EmptyState when meeting does not exist', () => {
    render(<MeetingDetailScaffold meeting={undefined} meetingId="non-existent-id" />);
    
    expect(screen.getByText('Meeting Not Found')).toBeDefined();
    expect(screen.getByText(/No recorded meeting exists with identifier "non-existent-id"/i)).toBeDefined();
    expect(screen.getByText('Back to Meetings')).toBeDefined();
  });

  it('renders valid meeting title and participants for ready meetings', () => {
    const readyMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-01')!;
    render(<MeetingDetailScaffold meeting={readyMeeting} meetingId={readyMeeting.id} />);

    expect(screen.getByText(readyMeeting.title)).toBeDefined();
    expect(screen.getByText('Sarah Connor')).toBeDefined();
    expect(screen.getByText('Meeting Intelligence Workspace Scaffold (Phase 03)')).toBeDefined();
  });

  it('renders scheduled call state with scheduling notice', () => {
    const scheduledMeeting = SEEDED_MEETINGS.find((m) => m.status === 'scheduled')!;
    render(<MeetingDetailScaffold meeting={scheduledMeeting} meetingId={scheduledMeeting.id} />);

    expect(screen.getByText('This Meeting is Scheduled')).toBeDefined();
    expect(screen.getByText(/Recording and automated AI note taking will begin when the call starts/i)).toBeDefined();
  });

  it('renders processing state notice with step breakdown', () => {
    const processingMeeting = SEEDED_MEETINGS.find((m) => m.status === 'processing')!;
    render(<MeetingDetailScaffold meeting={processingMeeting} meetingId={processingMeeting.id} />);

    expect(screen.getByText('AI Intelligence In Progress')).toBeDefined();
    expect(screen.getByText(/Generating synchronized timestamps.../i)).toBeDefined();
  });

  it('renders error state and failure details when meeting processing failed', () => {
    const failedMeeting = SEEDED_MEETINGS.find((m) => m.status === 'failed')!;
    render(<MeetingDetailScaffold meeting={failedMeeting} meetingId={failedMeeting.id} />);

    expect(screen.getByText('Meeting Recording Failed')).toBeDefined();
    expect(screen.getByText(failedMeeting.failureReason!)).toBeDefined();
  });
});
