import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import {
  ACTION_PANEL_ACTION_BY_KEY,
  ACTION_PANEL_ACTION_DEFINITIONS,
  type ActionPanelActionDefinition,
} from '../../action-panel/actionPanelActions';
import {
  getActionPanelDisplayBounds,
  getActionPanelEditorBounds,
  type ActionPanelActionKey,
  type Preferences,
} from '../../preferences/preferences';
import { ActionPanelEditorCanvas } from './action-panel/ActionPanelEditorCanvas';
import { ActionPanelLibrary } from './action-panel/ActionPanelLibrary';
import {
  DRAG_ACTIVATION_DELAY_MS,
  type DragData,
  reorderLibraryOrder,
} from './action-panel/actionPanelDrag';

interface ActionPanelSettingsSectionProps {
  prefs: Preferences;
  onCellPlace: (
    action: ActionPanelActionKey,
    row: number,
    column: number,
    sourceCellId?: string,
  ) => void;
  onCellRemove: (cellId: string) => void;
  onLibraryOrderChange: (libraryOrder: ActionPanelActionKey[]) => void;
  onVisibleRowsChange: (visibleRows: number) => void;
}

export function ActionPanelSettingsSection({
  prefs,
  onCellPlace,
  onCellRemove,
  onLibraryOrderChange,
  onVisibleRowsChange,
}: ActionPanelSettingsSectionProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: DRAG_ACTIVATION_DELAY_MS, tolerance: 8 },
    }),
  );
  const [isDraggingAction, setIsDraggingAction] = useState(false);
  const { actionPanel } = prefs;
  const displayBounds = useMemo(
    () => getActionPanelDisplayBounds(actionPanel.cells),
    [actionPanel.cells],
  );
  const editorBounds = useMemo(
    () => getActionPanelEditorBounds(actionPanel.cells),
    [actionPanel.cells],
  );
  const hasConfiguredCells = actionPanel.cells.length > 0;
  const actualVisibleRows = hasConfiguredCells
    ? Math.min(actionPanel.visibleRows, displayBounds.rows)
    : 0;
  const cellByPosition = useMemo(
    () => new Map(actionPanel.cells.map((cell) => [`${cell.row}:${cell.column}`, cell])),
    [actionPanel.cells],
  );
  const orderedDefinitions = useMemo(() => {
    const definitions = actionPanel.libraryOrder
      .map((action) => ACTION_PANEL_ACTION_BY_KEY.get(action))
      .filter((definition): definition is ActionPanelActionDefinition => definition !== undefined);

    if (definitions.length === ACTION_PANEL_ACTION_DEFINITIONS.length) {
      return definitions;
    }

    const seen = new Set(definitions.map((definition) => definition.action));
    return [
      ...definitions,
      ...ACTION_PANEL_ACTION_DEFINITIONS.filter((definition) => !seen.has(definition.action)),
    ];
  }, [actionPanel.libraryOrder]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setIsDraggingAction(false);
    if (!over || typeof over.id !== 'string') {
      return;
    }

    const data = active.data.current as DragData | undefined;
    if (!data) {
      return;
    }

    if (over.id.startsWith('panel-cell:')) {
      const [, rowValue, columnValue] = over.id.split(':');
      const row = Number(rowValue);
      const column = Number(columnValue);
      if (!Number.isFinite(row) || !Number.isFinite(column)) {
        return;
      }

      if (data.type === 'library') {
        onCellPlace(data.action, row, column);
        return;
      }

      onCellPlace(data.action, row, column, data.cellId);
      return;
    }

    if (data.type !== 'library' || !over.id.startsWith('library-item:')) {
      return;
    }

    const overAction = over.id.slice('library-item:'.length) as ActionPanelActionKey;
    if (overAction === data.action) {
      return;
    }

    onLibraryOrderChange(
      reorderLibraryOrder(actionPanel.libraryOrder, data.action, overAction),
    );
  };

  return (
    <section className="settings-group">
      <h3>快捷面板布局</h3>
      <p className="settings-hint">
        这里控制的是主界面底部快捷面板的最大显示高度，以及按钮在面板里的排布方式。空面板时会先显示一个空槽；只要放入按钮，编辑网格就会在四周补出可继续扩展的空槽。
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={() => setIsDraggingAction(true)}
        onDragCancel={() => setIsDraggingAction(false)}
        onDragEnd={handleDragEnd}
      >
        <div className="action-panel-editor">
          <section className="action-panel-editor-panel">
            <ActionPanelEditorCanvas
              actionPanel={actionPanel}
              actualVisibleRows={actualVisibleRows}
              cellByPosition={cellByPosition}
              editorBounds={editorBounds}
              hasConfiguredCells={hasConfiguredCells}
              isDraggingAction={isDraggingAction}
              onCellRemove={onCellRemove}
              onVisibleRowsChange={onVisibleRowsChange}
            />
            <ActionPanelLibrary orderedDefinitions={orderedDefinitions} />
          </section>
        </div>
      </DndContext>
    </section>
  );
}
