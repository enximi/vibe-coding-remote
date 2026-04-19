import { useCallback, useEffect, useReducer } from 'react';
import { useConnectionConfig } from '../runtime/ConnectionConfigContext';
import { useConnection } from '../runtime/ConnectionContext';
import { parseImportUrl } from './importConfig';
import {
  createInitialSettingsConnectionState,
  settingsConnectionReducer,
} from './settingsConnectionState';

export function useConnectionConfigController() {
  const {
    serverEndpoint,
    serverAuthToken,
    setConnectionConfig,
  } = useConnectionConfig();
  const { status, recheckConnection } = useConnection();
  const [state, dispatch] = useReducer(
    settingsConnectionReducer,
    { endpoint: serverEndpoint, token: serverAuthToken },
    ({ endpoint, token }) => createInitialSettingsConnectionState(endpoint, token),
  );

  useEffect(() => {
    dispatch({
      type: 'drafts_synced',
      endpoint: serverEndpoint,
      token: serverAuthToken,
    });
  }, [serverAuthToken, serverEndpoint]);

  const applyConnectionConfig = useCallback(
    (endpoint: string, token: string) => {
      const normalizedEndpoint = endpoint.trim();
      const normalizedToken = token.trim();
      const hasChanged =
        normalizedEndpoint !== serverEndpoint || normalizedToken !== serverAuthToken;

      if (!hasChanged) {
        void recheckConnection();
        return;
      }

      setConnectionConfig(normalizedEndpoint, normalizedToken);
    },
    [recheckConnection, serverAuthToken, serverEndpoint, setConnectionConfig],
  );

  const applyDrafts = useCallback(() => {
    applyConnectionConfig(state.endpointDraft, state.tokenDraft);
  }, [applyConnectionConfig, state.endpointDraft, state.tokenDraft]);

  const handleQrScan = useCallback(
    (rawValue: string) => {
      const parsed = parseImportUrl(rawValue);
      if (!parsed) {
        return false;
      }

      dispatch({ type: 'drafts_synced', endpoint: parsed.endpoint, token: parsed.token });
      dispatch({ type: 'scanner_closed' });
      applyConnectionConfig(parsed.endpoint, parsed.token);
      return true;
    },
    [applyConnectionConfig],
  );

  return {
    endpointDraft: state.endpointDraft,
    isScannerOpen: state.isScannerOpen,
    openScanner: () => dispatch({ type: 'scanner_opened' }),
    closeScanner: () => dispatch({ type: 'scanner_closed' }),
    applyDrafts,
    setEndpointDraft: (value: string) => dispatch({ type: 'endpoint_draft_changed', value }),
    setTokenDraft: (value: string) => dispatch({ type: 'token_draft_changed', value }),
    status,
    tokenDraft: state.tokenDraft,
    handleQrScan,
  };
}
