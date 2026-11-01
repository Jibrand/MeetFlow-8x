import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionItemsView } from './action-items-view';

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

describe('ActionItemsView Feature', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders seeded action items across meetings', () => {
    render(<ActionItemsView />);

    expect(screen.getByText('Add composite database index on [meetingId, startTime]')).toBeDefined();
    // SpeakerAvatar renders the assignee name in title attribute
    expect(screen.getByTitle('Alex Vance')).toBeDefined();
  });

  it('filters action items by open and completed filters', () => {
    render(<ActionItemsView />);

    // Click "Done" filter
    const doneTab = screen.getByText(/Done \(/);
    fireEvent.click(doneTab);

    // Initial seeded data has completed action items like act-02
    expect(screen.getByText('Document connection pooling configuration in README')).toBeDefined();
    expect(screen.queryByText('Add composite database index on [meetingId, startTime]')).toBeNull();
  });

  it('toggles completion status and stores override in localStorage', () => {
    render(<ActionItemsView />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];

    // Toggle the first action item
    fireEvent.click(firstCheckbox);

    const stored = localStorage.getItem('meetflow-action-items-state');
    expect(stored).not.toBeNull();
  });
});
