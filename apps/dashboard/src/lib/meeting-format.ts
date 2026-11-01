import { MeetingItem, MeetingPlatform } from '../types/meeting';

export const PLATFORM_LABEL: Record<MeetingPlatform, string> = {
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'Teams',
  upload: 'Upload',
};

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatMeetingDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMeetingTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function startOfDay(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

export type DateGroup = 'Upcoming' | 'Today' | 'Yesterday' | 'This Week' | 'Earlier';
export const DATE_GROUP_ORDER: DateGroup[] = ['Upcoming', 'Today', 'Yesterday', 'This Week', 'Earlier'];

/** Bucket a meeting into a relative date group based on the local calendar. */
export function getDateGroup(iso: string, now: Date = new Date()): DateGroup {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(now);
  const DAY = 86_400_000;
  if (day > today) return 'Upcoming';
  if (day === today) return 'Today';
  if (day === today - DAY) return 'Yesterday';
  if (day > today - 7 * DAY) return 'This Week';
  return 'Earlier';
}

export function groupMeetingsByDate(
  meetings: MeetingItem[],
  now: Date = new Date()
): { group: DateGroup; meetings: MeetingItem[] }[] {
  const map = new Map<DateGroup, MeetingItem[]>();
  for (const m of meetings) {
    const g = getDateGroup(m.startDate, now);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(m);
  }
  return DATE_GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, meetings: map.get(g)! }));
}
