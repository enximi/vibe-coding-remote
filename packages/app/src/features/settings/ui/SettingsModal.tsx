import { useCallback, useEffect, useState } from 'react';
import { CloseIcon } from '../../../ui/icons';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import { useConnection } from '../../runtime/model/ConnectionContext';
import { parseImportUrl } from '../model/importConfig';
import { QrScannerModal } from './QrScannerModal';
import {
  AppearanceSettingsSection,
  ConnectionSettingsSection,
  DockSettingsSection,
  EnterBehaviorSettingsSection,
  FeedbackSettingsSection,
  FontSizeSettingsSection,
  HistorySettingsSection,
} from './SettingsSections';
import { useSheetModal } from './useSheetModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHistorySelect: (text: string) => void;
  visibleDockActionCount: number | null;
}

export function SettingsModal({
  isOpen,
  onClose,
  onHistorySelect,
  visibleDockActionCount,
}: SettingsModalProps) {
  const {
    prefs,
    setPrefs,
    serverEndpoint,
    setServerEndpoint,
    serverAuthToken,
    setServerAuthToken,
    clearHistory,
    removeHistory,
  } = usePreferences();
  const { status, checkConnection } = useConnection();
  const {
    dialogRef,
    contentRef,
    requestClose,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    markOpened,
  } = useSheetModal(onClose);

  const [endpointDraft, setEndpointDraft] = useState(serverEndpoint);
  const [tokenDraft, setTokenDraft] = useState(serverAuthToken);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen) {
      markOpened();
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [dialogRef, isOpen, markOpened]);

  useEffect(() => {
    setEndpointDraft(serverEndpoint);
  }, [serverEndpoint]);

  useEffect(() => {
    setTokenDraft(serverAuthToken);
  }, [serverAuthToken]);

  const handleApplyConfig = useCallback(() => {
    setServerEndpoint(endpointDraft);
    setServerAuthToken(tokenDraft);
    void checkConnection(endpointDraft, tokenDraft);
  }, [checkConnection, endpointDraft, setServerAuthToken, setServerEndpoint, tokenDraft]);

  const handleQrScan = useCallback(
    (rawValue: string) => {
      const parsed = parseImportUrl(rawValue);
      if (!parsed) {
        return false;
      }

      setEndpointDraft(parsed.endpoint);
      setTokenDraft(parsed.token);
      setServerEndpoint(parsed.endpoint);
      setServerAuthToken(parsed.token);
      void checkConnection(parsed.endpoint, parsed.token);
      setIsScannerOpen(false);
      return true;
    },
    [checkConnection, setServerAuthToken, setServerEndpoint],
  );

  return (
    <dialog
      ref={dialogRef}
      id="menuModal"
      className="modal"
      onPointerDown={(event) => {
        if (event.target === dialogRef.current) {
          event.preventDefault();
          requestClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <div
        className="modal-content"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-header">
          <h2 className="modal-title">偏好设置</h2>
          <button
            className="close-btn"
            type="button"
            aria-label="关闭"
            onPointerDown={(event) => {
              event.preventDefault();
              requestClose();
            }}
            onClick={requestClose}
          >
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <ConnectionSettingsSection
          status={status}
          endpointDraft={endpointDraft}
          tokenDraft={tokenDraft}
          onEndpointDraftChange={setEndpointDraft}
          onTokenDraftChange={setTokenDraft}
          onApply={handleApplyConfig}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
        <AppearanceSettingsSection prefs={prefs} setPrefs={setPrefs} />
        <EnterBehaviorSettingsSection prefs={prefs} setPrefs={setPrefs} />
        <FontSizeSettingsSection prefs={prefs} setPrefs={setPrefs} />
        <FeedbackSettingsSection prefs={prefs} setPrefs={setPrefs} />
        <DockSettingsSection
          prefs={prefs}
          setPrefs={setPrefs}
          visibleDockActionCount={visibleDockActionCount}
        />
        <HistorySettingsSection
          history={prefs.history}
          onClear={clearHistory}
          onRemove={removeHistory}
          onSelect={onHistorySelect}
        />
      </div>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleQrScan}
      />
    </dialog>
  );
}
