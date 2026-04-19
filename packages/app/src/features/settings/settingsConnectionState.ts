export type SettingsConnectionState = {
  endpointDraft: string;
  isScannerOpen: boolean;
  tokenDraft: string;
};

export type SettingsConnectionAction =
  | { type: 'drafts_synced'; endpoint: string; token: string }
  | { type: 'endpoint_draft_changed'; value: string }
  | { type: 'token_draft_changed'; value: string }
  | { type: 'scanner_opened' }
  | { type: 'scanner_closed' };

export function createInitialSettingsConnectionState(
  endpoint: string,
  token: string,
): SettingsConnectionState {
  return {
    endpointDraft: endpoint,
    isScannerOpen: false,
    tokenDraft: token,
  };
}

export function settingsConnectionReducer(
  state: SettingsConnectionState,
  action: SettingsConnectionAction,
): SettingsConnectionState {
  switch (action.type) {
    case 'drafts_synced':
      return {
        ...state,
        endpointDraft: action.endpoint,
        tokenDraft: action.token,
      };
    case 'endpoint_draft_changed':
      return {
        ...state,
        endpointDraft: action.value,
      };
    case 'token_draft_changed':
      return {
        ...state,
        tokenDraft: action.value,
      };
    case 'scanner_opened':
      return {
        ...state,
        isScannerOpen: true,
      };
    case 'scanner_closed':
      return {
        ...state,
        isScannerOpen: false,
      };
  }
}
