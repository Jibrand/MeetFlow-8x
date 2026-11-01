import { TranscriptTurnItem } from '../../../types/meeting';

/**
 * Finds the index of the active transcript turn using binary search.
 * Each turn spans [startTime, endTime].
 * Returns -1 if no turn matches currentTime.
 */
export function findActiveTurnIndex(
  turns: TranscriptTurnItem[],
  currentTime: number
): number {
  if (!turns || turns.length === 0) return -1;

  let low = 0;
  let high = turns.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const turn = turns[mid];

    if (currentTime >= turn.startTime && currentTime <= turn.endTime) {
      return mid;
    }

    if (currentTime < turn.startTime) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  // Fallback: If between turns or slightly past, pick the closest previous turn
  for (let i = turns.length - 1; i >= 0; i--) {
    if (currentTime >= turns[i].startTime) {
      return i;
    }
  }

  return 0;
}

export interface TranscriptSearchResult {
  turnIndex: number;
  turn: TranscriptTurnItem;
}

export function searchTranscript(
  turns: TranscriptTurnItem[],
  query: string
): TranscriptSearchResult[] {
  if (!turns || !query.trim()) return [];
  const q = query.toLowerCase();

  const results: TranscriptSearchResult[] = [];
  turns.forEach((turn, idx) => {
    if (
      turn.text.toLowerCase().includes(q) ||
      turn.speakerName.toLowerCase().includes(q)
    ) {
      results.push({ turnIndex: idx, turn });
    }
  });

  return results;
}

export interface TextMatchPart {
  text: string;
  isMatch: boolean;
}

export function splitTextWithMatches(text: string, query: string): TextMatchPart[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const parts: TextMatchPart[] = [];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.index), isMatch: false });
    }
    parts.push({ text: match[0], isMatch: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), isMatch: false });
  }

  return parts;
}
