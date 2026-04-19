import type { HistoryItem, StoredPreferences } from './preferenceTypes';

const DEFAULT_HISTORY_MAX_ITEMS = 50;
const MIN_HISTORY_MAX_ITEMS = 10;
const MAX_HISTORY_MAX_ITEMS = 200;

export function appendHistory(
  history: HistoryItem[],
  text: string,
  maxItems: number,
): HistoryItem[] {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return history;
  }

  const nextHistory = history.filter((item) => item.text !== normalizedText);
  nextHistory.unshift({ text: normalizedText, time: Date.now() });
  nextHistory.length = Math.min(nextHistory.length, clampHistoryMaxItems(maxItems));
  return nextHistory;
}

export function removeHistoryItem(history: HistoryItem[], time: number): HistoryItem[] {
  return history.filter((item) => item.time !== time);
}

export function clearHistoryItems(): HistoryItem[] {
  return [];
}

export function clampHistoryMaxItems(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_HISTORY_MAX_ITEMS;
  }

  return Math.max(
    MIN_HISTORY_MAX_ITEMS,
    Math.min(MAX_HISTORY_MAX_ITEMS, Math.floor(value)),
  );
}

export function normalizeStoredHistory(history: StoredPreferences['history']): HistoryItem[] {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((item) => {
      if (typeof item === 'string') {
        return { text: item, time: Date.now() };
      }

      if (!item || typeof item.text !== 'string' || typeof item.time !== 'number') {
        return null;
      }

      return item;
    })
    .filter((item): item is HistoryItem => item !== null);
}
