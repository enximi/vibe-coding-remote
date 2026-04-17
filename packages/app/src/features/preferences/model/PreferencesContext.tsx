import { createContext, type PropsWithChildren, useContext } from 'react';
import { type PreferencesStore, usePreferencesStore } from './usePreferencesStore';

const PreferencesContext = createContext<PreferencesStore | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const preferences = usePreferencesStore();
  return <PreferencesContext.Provider value={preferences}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) {
    throw new Error('Preferences are not available in the current app shell.');
  }

  return preferences;
}
