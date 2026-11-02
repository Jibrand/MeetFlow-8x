import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { HighlightsPanel } from './highlights-panel';

describe('Highlight details', () => {
  it('shows full content and context around its timestamp, then navigates to the transcript', () => {
    const seek = vi.fn();
    render(<HighlightsPanel highlights={[{ id: 'highlight', label: 'Decision', quote: 'repeated quote', tag: 'Decision', startTime: 100, hasTimestamp: true }]}
      turns={Array.from({ length: 7 }, (_, i) => ({ id: String(i), speakerName: 'Alice', text: `Turn ${i}: repeated quote`, startTime: i * 20, endTime: (i + 1) * 20 }))}
      onSeek={seek} onOpenCreate={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open highlight: Decision' }));
    const modal = within(screen.getByRole('dialog'));
    expect(modal.getByText('repeated quote')).toBeDefined();
    expect(modal.getByText('Turn 5: repeated quote')).toBeDefined();
    expect(modal.queryByText('Turn 0: repeated quote')).toBeNull();
    fireEvent.click(modal.getByRole('button', { name: 'View in transcript' }));
    expect(seek).toHaveBeenCalledWith(100);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
