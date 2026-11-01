import { MeetingClip } from '../../../types/meeting';

const STORAGE_KEY = 'meetflow-clips-store-v1';
const EVENT_NAME = 'meetflow-clips-updated';

export function getMeetingClips(meetingId: string): MeetingClip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const all: MeetingClip[] = JSON.parse(raw);
      return all.filter((c) => c.meetingId === meetingId);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function saveMeetingClip(clip: Omit<MeetingClip, 'id' | 'createdAt'>): MeetingClip {
  const newClip: MeetingClip = {
    ...clip,
    id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: MeetingClip[] = raw ? JSON.parse(raw) : [];
    const updated = [newClip, ...all];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // Ignore write errors
  }

  return newClip;
}

export function deleteMeetingClip(clipId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const all: MeetingClip[] = JSON.parse(raw);
      const filtered = all.filter((c) => c.id !== clipId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  } catch {
    // Ignore write errors
  }
}

export function subscribeToClips(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
