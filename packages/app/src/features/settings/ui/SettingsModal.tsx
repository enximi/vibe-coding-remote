import { useEffect } from 'react';
import { CloseIcon } from '../../../ui/icons';
import { usePreferences } from '../../preferences/model/PreferencesContext';
import { useConnectionConfigController } from '../model/useConnectionConfigController';
import { useSheetModal } from './hooks/useSheetModal';
import { QrScannerModal } from './QrScannerModal';
import {
  AppearanceSettingsSection,
  ActionPanelSettingsSection,
  ConnectionSettingsSection,
  EnterBehaviorSettingsSection,
  FeedbackSettingsSection,
  FontSizeSettingsSection,
  HistorySettingsSection,
} from './sections';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHistorySelect: (text: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onHistorySelect,
}: SettingsModalProps) {
  const connection = useConnectionConfigController();
  const {
    prefs,
    clearHistory,
    placeActionPanelCell,
    removeHistory,
    removeActionPanelCell,
    setHistoryMaxItems,
    setActionPanelLibraryOrder,
    setActionPanelVisibleRows,
    setEnterBehavior,
    setFontSize,
    setTheme,
    toggleVibration,
  } = usePreferences();
  const {
    dialogRef,
    surfaceRef,
    contentRef,
    requestClose,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    markOpened,
  } = useSheetModal(onClose);

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
        className="modal-surface"
        ref={surfaceRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-content" ref={contentRef}>
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
            status={connection.status}
            endpointDraft={connection.endpointDraft}
            tokenDraft={connection.tokenDraft}
            onEndpointDraftChange={connection.setEndpointDraft}
            onTokenDraftChange={connection.setTokenDraft}
            onApply={connection.applyDrafts}
            onOpenScanner={connection.openScanner}
          />
          <AppearanceSettingsSection prefs={prefs} onThemeChange={setTheme} />
          <EnterBehaviorSettingsSection prefs={prefs} onEnterBehaviorChange={setEnterBehavior} />
          <FontSizeSettingsSection prefs={prefs} onFontSizeChange={setFontSize} />
          <FeedbackSettingsSection prefs={prefs} onToggleVibration={toggleVibration} />
          <ActionPanelSettingsSection
            prefs={prefs}
            onCellPlace={placeActionPanelCell}
            onCellRemove={removeActionPanelCell}
            onLibraryOrderChange={setActionPanelLibraryOrder}
            onVisibleRowsChange={setActionPanelVisibleRows}
          />
          <HistorySettingsSection
            historyMaxItems={prefs.historyMaxItems}
            history={prefs.history}
            onClear={clearHistory}
            onHistoryMaxItemsChange={setHistoryMaxItems}
            onRemove={removeHistory}
            onSelect={onHistorySelect}
          />
        </div>
      </div>

      <QrScannerModal
        isOpen={connection.isScannerOpen}
        onClose={connection.closeScanner}
        onScan={connection.handleQrScan}
      />
    </dialog>
  );
}
