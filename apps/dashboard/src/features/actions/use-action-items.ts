import * as React from 'react';
import { ActionItemData } from '../../types/meeting';
import {
  getMergedActionItems,
  subscribeToActionItemChanges,
} from '../meeting-detail/lib/action-items-store';

/** Live view of the shared local action-item store (optionally scoped to one meeting). */
export function useActionItems(meetingId?: string): ActionItemData[] {
  const [items, setItems] = React.useState<ActionItemData[]>(() =>
    getMergedActionItems(meetingId)
  );

  React.useEffect(() => {
    setItems(getMergedActionItems(meetingId));
    return subscribeToActionItemChanges(() => setItems(getMergedActionItems(meetingId)));
  }, [meetingId]);

  return items;
}

/** Start of the local day, used for overdue/due-soon comparisons. */
export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Parse a YYYY-MM-DD due date as a local calendar date. */
export function parseDueDate(due?: string): Date | null {
  if (!due) return null;
  const [y, m, d] = due.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isOverdue(item: ActionItemData, now: Date = new Date()): boolean {
  const due = parseDueDate(item.dueDate);
  return !item.completed && !!due && due < startOfToday(now);
}
