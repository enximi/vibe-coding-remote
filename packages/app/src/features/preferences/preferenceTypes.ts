export type HistoryItem = {
  text: string;
  time: number;
};

export type ActionPanelActionKey =
  | 'send'
  | 'enter'
  | 'escape'
  | 'tab'
  | 'shiftTab'
  | 'ctrlC'
  | 'ctrlV'
  | 'pasteNewline'
  | 'backspace'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight';

export type ActionPanelCell = {
  id: string;
  action: ActionPanelActionKey;
  column: number;
  row: number;
};

export type ActionPanelPreferences = {
  cells: ActionPanelCell[];
  libraryOrder: ActionPanelActionKey[];
  visibleRows: number;
};

export type Preferences = {
  theme: 'system' | 'light' | 'dark';
  enterBehavior: 'send' | 'newline';
  fontSize: number;
  historyMaxItems: number;
  vibrationEnabled: boolean;
  actionPanel: ActionPanelPreferences;
  history: HistoryItem[];
};

export type StoredPreferences = Partial<Preferences> & {
  history?: Array<HistoryItem | string>;
};
