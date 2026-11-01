import { HighlightData } from '../../../types/meeting';
import { SEEDED_MEETINGS } from '../../../data/seeded-meetings';

const STORAGE_KEY = 'meetflow-highlights-store-v1';
const EVENT_NAME = 'meetflow-highlights-updated';

export interface HighlightsStoreState {
  createdMap?: Record<string, HighlightData[]>; // keyed by meetingId
  updatedMap?: Record<string, Partial<HighlightData>>; // keyed by highlight id
  deletedIds?: string[];
}

function getStoredHighlightsState(): HighlightsStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveStoredHighlightsState(state: HighlightsStoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // Ignore write errors
  }
}

export function getMeetingHighlights(meetingId: string): HighlightData[] {
  const meeting = SEEDED_MEETINGS.find((m) => m.id === meetingId);
  const baseHighlights: HighlightData[] = meeting?.highlights || [];
  const state = getStoredHighlightsState();
  const deletedIds = new Set(state.deletedIds || []);
  const updatedMap = state.updatedMap || {};
  const customForMeeting = (state.createdMap || {})[meetingId] || [];

  const mergedBase = baseHighlights
    .filter((h) => !deletedIds.has(h.id))
    .map((h) => ({
      ...h,
      ...(updatedMap[h.id] || {}),
    }));

  const mergedCustom = customForMeeting
    .filter((h) => !deletedIds.has(h.id))
    .map((h) => ({
      ...h,
      ...(updatedMap[h.id] || {}),
    }));

  const combined = [...mergedCustom, ...mergedBase];
  // Sort chronologically by startTime
  combined.sort((a, b) => a.startTime - b.startTime);
  return combined;
}

export function addMeetingHighlight(highlight: Omit<HighlightData, 'id'>): HighlightData {
  const state = getStoredHighlightsState();
  const createdMap = state.createdMap || {};
  const list = createdMap[highlight.meetingId] || [];

  const newHighlight: HighlightData = {
    ...highlight,
    id: `hl-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };

  createdMap[highlight.meetingId] = [newHighlight, ...list];
  saveStoredHighlightsState({ ...state, createdMap });
  return newHighlight;
}

export function updateMeetingHighlight(id: string, updates: Partial<HighlightData>) {
  const state = getStoredHighlightsState();
  const updatedMap = state.updatedMap || {};
  updatedMap[id] = { ...(updatedMap[id] || {}), ...updates };
  saveStoredHighlightsState({ ...state, updatedMap });
}

export function deleteMeetingHighlight(id: string) {
  const state = getStoredHighlightsState();
  const deletedIds = state.deletedIds || [];
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
  }
  saveStoredHighlightsState({ ...state, deletedIds });
}

export function subscribeToHighlights(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
