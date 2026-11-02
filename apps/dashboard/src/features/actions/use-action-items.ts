import { useQuery } from '@tanstack/react-query';
import { ActionItemData } from '../../types/meeting';
import { apiFetchActionItems } from '../meetings/meetings-api';

export function useActionItemsQuery(meetingId?: string) {
  return useQuery({
    queryKey: ['action-items', meetingId ?? 'all'],
    queryFn: () => apiFetchActionItems(meetingId ? { meetingId } : undefined),
    retry: false,
    gcTime: 0,
    staleTime: 0,
    refetchInterval: 5000,
  });
}

/** Workspace-scoped backend items; shared with the sidebar count. */
export function useActionItems(meetingId?: string): ActionItemData[] {
  return useActionItemsQuery(meetingId).data ?? [];
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
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(due);
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isOverdue(
  item: ActionItemData,
  now: Date = new Date(),
): boolean {
  const due = parseDueDate(item.dueDate);
  return !item.completed && !!due && due < startOfToday(now);
}
