import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeetingList } from './meeting-list';
import { SEEDED_MEETINGS } from '../../data/seeded-meetings';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => {
  const React = require('react');
  const Link = React.forwardRef(({ children, to, params, className }: any, ref: any) => {
    const href = params?.meetingId ? `/meetings/${params.meetingId}` : to;
    return (
      <a ref={ref} href={href} className={className}>
        {children}
      </a>
    );
  });
  Link.displayName = 'Link';
  return {
    Link,
    useNavigate: () => vi.fn(),
    useSearch: () => ({}),
  };
});

describe('MeetingList Feature', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders all seeded meetings by default', () => {
    render(<MeetingList meetings={SEEDED_MEETINGS} />);
    
    // Check that primary titles from seeded data appear
    expect(screen.getByText('Engineering Architecture: Neon Serverless & Event Pipelines')).toBeDefined();
    expect(screen.getByText('Customer Discovery: Acme Corp Enterprise Expansion')).toBeDefined();
  });

  it('filters meetings when search query is entered', () => {
    render(<MeetingList meetings={SEEDED_MEETINGS} />);
    
    const searchInput = screen.getByPlaceholderText(/search meetings by title/i);
    fireEvent.change(searchInput, { target: { value: 'Acme Corp' } });

    expect(screen.getByText('Customer Discovery: Acme Corp Enterprise Expansion')).toBeDefined();
    expect(screen.queryByText('Engineering Architecture: Neon Serverless & Event Pipelines')).toBeNull();
  });

  it('filters meetings by status filter', () => {
    render(<MeetingList meetings={SEEDED_MEETINGS} />);
    
    const statusSelect = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusSelect, { target: { value: 'failed' } });

    // Only the failed meeting should remain
    expect(screen.getByText('Ad-hoc Standup: Corrupted Audio Stream')).toBeDefined();
    expect(screen.queryByText('Engineering Architecture: Neon Serverless & Event Pipelines')).toBeNull();
  });

  it('displays empty state when no meetings match query', () => {
    render(<MeetingList meetings={SEEDED_MEETINGS} />);
    
    const searchInput = screen.getByPlaceholderText(/search meetings by title/i);
    fireEvent.change(searchInput, { target: { value: 'xyznonexistentquery999' } });

    expect(screen.getByText('No meetings found')).toBeDefined();
    expect(screen.getByText(/Try broadening your search or resetting your status\/platform filters/i)).toBeDefined();
  });

  it('resets filters when "Clear Filters" button in empty state is clicked', () => {
    render(<MeetingList meetings={SEEDED_MEETINGS} />);
    
    const searchInput = screen.getByPlaceholderText(/search meetings by title/i);
    fireEvent.change(searchInput, { target: { value: 'xyznonexistentquery999' } });

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(screen.getByText('Engineering Architecture: Neon Serverless & Event Pipelines')).toBeDefined();
  });
});
