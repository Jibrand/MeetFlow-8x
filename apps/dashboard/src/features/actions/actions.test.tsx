import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithQuery } from '../../test-utils';
import { ActionItemsView } from './action-items-view';
import {
  apiFetchActionItems,
  apiUpdateActionItem,
} from '../meetings/meetings-api';
import type { ActionItemData } from '../../types/meeting';

vi.mock('../auth/lib/auth-adapter', () => ({
  authAdapter: { getUser: () => ({ id: 'test', workspaceId: 'workspace' }) },
}));
vi.mock('../meetings/meetings-api', () => ({
  apiFetchActionItems: vi.fn(),
  apiUpdateActionItem: vi.fn(),
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
const initial: ActionItemData[] = [
  {
    id: 'task-1',
    meetingId: 'meeting-1',
    title: 'Backend task',
    assigneeName: 'Dana',
    completed: false,
    priority: 'medium',
  },
  {
    id: 'task-2',
    meetingId: 'meeting-1',
    title: 'Completed backend task',
    completed: true,
    priority: 'low',
  },
];
let data: ActionItemData[];
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  data = initial.map((item) => ({ ...item }));
  vi.mocked(apiFetchActionItems).mockImplementation(async () => data);
  vi.mocked(apiUpdateActionItem).mockImplementation(async (id, update) => {
    data = data.map((item) =>
      item.id === id ? { ...item, completed: update.status === 'DONE' } : item,
    );
    return data.find((item) => item.id === id)!;
  });
});
describe('Backend task interactions', () => {
  it('renders backend items and filters completed tasks', async () => {
    renderWithQuery(<ActionItemsView />);
    await screen.findByText('Backend task');
    fireEvent.click(screen.getByRole('button', { name: /Done \(/ }));
    expect(screen.getByText('Completed backend task')).toBeInTheDocument();
    expect(screen.queryByText('Backend task')).not.toBeInTheDocument();
  });
  it('shows an empty workspace without demo tasks', async () => {
    vi.mocked(apiFetchActionItems).mockResolvedValue([]);
    renderWithQuery(<ActionItemsView />);
    await screen.findByText('No action items found');
    expect(screen.queryByText('Backend task')).not.toBeInTheDocument();
  });
  it('checks immediately, locks while saving, and restores the value after failure', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(apiUpdateActionItem).mockReturnValueOnce(
      new Promise((_, fail) => {
        reject = fail;
      }),
    );
    renderWithQuery(<ActionItemsView />);
    const checkbox = await screen.findByRole('checkbox', {
      name: 'Complete Backend task',
    });
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
    expect(checkbox).toBeDisabled();
    expect(
      screen.getByRole('status', { name: 'Saving task' }),
    ).toBeInTheDocument();
    await act(async () => reject(new Error('Save failed')));
    await waitFor(() => expect(checkbox).not.toBeChecked());
    await waitFor(() => expect(checkbox).toBeEnabled());
    expect(
      localStorage.getItem('meetflow-action-items-overrides-v2'),
    ).toBeNull();
  });
  it('does not roll back another task when concurrent saves have different outcomes', async () => {
    data[1].completed = false;
    let rejectFirst!: (error: Error) => void;
    let finishSecond!: () => void;
    vi.mocked(apiUpdateActionItem).mockImplementation((id) =>
      id === 'task-1'
        ? new Promise((_, reject) => {
            rejectFirst = reject;
          })
        : new Promise((resolve) => {
            finishSecond = () => {
              data[1] = { ...data[1], completed: true };
              resolve(data[1]);
            };
          }),
    );
    renderWithQuery(<ActionItemsView />);
    const first = await screen.findByRole('checkbox', {
      name: 'Complete Backend task',
    });
    const second = screen.getByRole('checkbox', {
      name: 'Complete Completed backend task',
    });
    fireEvent.click(first);
    fireEvent.click(second);
    await waitFor(() => {
      expect(first).toBeChecked();
      expect(second).toBeChecked();
    });
    await act(async () => finishSecond());
    await act(async () => rejectFirst(new Error('First failed')));
    await waitFor(() => {
      expect(first).not.toBeChecked();
      expect(second).toBeChecked();
    });
  });
});
