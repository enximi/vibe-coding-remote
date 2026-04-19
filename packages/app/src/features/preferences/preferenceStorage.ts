import { PREFERENCES_STORAGE_KEY } from '../../shared/config/storage';
import {
  DEFAULT_ACTION_PANEL,
  normalizeStoredActionPanel,
} from './actionPanelPreferences';
import {
  clampHistoryMaxItems,
  normalizeStoredHistory,
} from './historyPreferences';
import type { Preferences, StoredPreferences } from './preferenceTypes';

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  enterBehavior: 'send',
  fontSize: 24,
  historyMaxItems: clampHistoryMaxItems(undefined),
  vibrationEnabled: true,
  actionPanel: DEFAULT_ACTION_PANEL,
  history: [],
};

export function loadPreferences(): Preferences {
  try {
    const saved = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!saved) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(saved) as StoredPreferences;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      fontSize:
        typeof parsed.fontSize === 'number'
          ? Math.max(16, Math.min(64, parsed.fontSize))
          : DEFAULT_PREFERENCES.fontSize,
      historyMaxItems: clampHistoryMaxItems(parsed.historyMaxItems),
      vibrationEnabled:
        typeof parsed.vibrationEnabled === 'boolean'
          ? parsed.vibrationEnabled
          : DEFAULT_PREFERENCES.vibrationEnabled,
      actionPanel: normalizeStoredActionPanel(parsed.actionPanel),
      history: normalizeStoredHistory(parsed.history).slice(
        0,
        clampHistoryMaxItems(parsed.historyMaxItems),
      ),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
