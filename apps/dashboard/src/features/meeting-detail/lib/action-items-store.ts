import { ActionItemData } from '../../../types/meeting';
import { getAllSeededActionItems, SEEDED_MEETINGS } from '../../../data/seeded-meetings';

const STORAGE_KEY = 'meetflow-action-items-overrides-v2';
const EVENT_NAME = 'meetflow-action-items-updated';

export interface ActionItemOverrides {
  completedMap?: Record<string, boolean>;
  updatedItems?: Record<string, Partial<ActionItemData>>;
  createdItems?: ActionItemData[];
  deletedIds?: string[];
}

function getStoredOverrides(): ActionItemOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore localStorage parse errors
  }
  return {};
}

function saveStoredOverrides(overrides: ActionItemOverrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // Ignore localStorage write errors
  }
}

export function getMergedActionItems(meetingId?: string): ActionItemData[] {
  const overrides = getStoredOverrides();
  const completedMap = overrides.completedMap || {};
  const updatedItems = overrides.updatedItems || {};
  const deletedIds = new Set(overrides.deletedIds || []);
  const createdItems = overrides.createdItems || [];

  let baseItems: ActionItemData[] = [];
  if (meetingId) {
    const meeting = SEEDED_MEETINGS.find((m) => m.id === meetingId);
    baseItems = (meeting?.actionItems || []).map((item) => ({
      ...item,
      meetingTitle: meeting?.title,
    }));
  } else {
    baseItems = getAllSeededActionItems();
  }

  // Filter out deleted
  let result = baseItems.filter((i) => !deletedIds.has(i.id));

  // Apply updates & completion status
  result = result.map((item) => {
    const updates = updatedItems[item.id] || {};
    const completed = completedMap[item.id] !== undefined ? completedMap[item.id] : item.completed;
    return {
      ...item,
      ...updates,
      completed,
    };
  });

  // Include created items
  const relevantCreated = createdItems.filter((item) => {
    if (deletedIds.has(item.id)) return false;
    if (meetingId && item.meetingId !== meetingId) return false;
    return true;
  });

  return [...relevantCreated, ...result];
}

export function toggleActionItemCompleted(id: string, completed: boolean) {
  const overrides = getStoredOverrides();
  const completedMap = overrides.completedMap || {};
  completedMap[id] = completed;
  saveStoredOverrides({ ...overrides, completedMap });
}

export function updateActionItemData(id: string, updates: Partial<ActionItemData>) {
  const overrides = getStoredOverrides();
  const updatedItems = overrides.updatedItems || {};
  updatedItems[id] = { ...(updatedItems[id] || {}), ...updates };
  saveStoredOverrides({ ...overrides, updatedItems });
}

export function addActionItemData(item: Omit<ActionItemData, 'id'>): ActionItemData {
  const overrides = getStoredOverrides();
  const createdItems = overrides.createdItems || [];
  const newItem: ActionItemData = {
    ...item,
    id: `act-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  saveStoredOverrides({ ...overrides, createdItems: [newItem, ...createdItems] });
  return newItem;
}

export function deleteActionItemData(id: string) {
  const overrides = getStoredOverrides();
  const deletedIds = overrides.deletedIds || [];
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
  }
  saveStoredOverrides({ ...overrides, deletedIds });
}

export function subscribeToActionItemChanges(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
