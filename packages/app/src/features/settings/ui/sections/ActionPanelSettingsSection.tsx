import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  ACTION_PANEL_ACTION_BY_KEY,
  ACTION_PANEL_ACTION_DEFINITIONS,
  type ActionPanelActionDefinition,
} from '../../../action-panel/model/actionPanelActions';
import type {
  ActionPanelActionKey,
  ActionPanelCell,
  Preferences,
} from '../../../preferences/model/preferences';

interface ActionPanelSettingsSectionProps {
  prefs: Preferences;
  onCellPlace: (
    action: ActionPanelActionKey,
    row: number,
    column: number,
    sourceCellId?: string,
  ) => void;
  onCellRemove: (cellId: string) => void;
  onColumnInsert: (index: number) => void;
  onColumnRemove: (index: number) => void;
  onRowInsert: (index: number) => void;
  onRowRemove: (index: number) => void;
  onVisibleRowsChange: (visibleRows: number) => void;
}

type DragData =
  | { type: 'library'; action: ActionPanelActionKey }
  | { type: 'cell'; action: ActionPanelActionKey; cellId: string };

export function ActionPanelSettingsSection({
  prefs,
  onCellPlace,
  onCellRemove,
  onColumnInsert,
  onColumnRemove,
  onRowInsert,
  onRowRemove,
  onVisibleRowsChange,
}: ActionPanelSettingsSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const { actionPanel } = prefs;
  const cellByPosition = new Map(
    actionPanel.cells.map((cell) => [`${cell.row}:${cell.column}`, cell]),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || typeof over.id !== 'string' || !over.id.startsWith('panel-cell:')) {
      return;
    }

    const [, rowValue, columnValue] = over.id.split(':');
    const row = Number(rowValue);
    const column = Number(columnValue);
    const data = active.data.current as DragData | undefined;
    if (!data || !Number.isFinite(row) || !Number.isFinite(column)) {
      return;
    }

    if (data.type === 'library') {
      onCellPlace(data.action, row, column);
      return;
    }

    onCellPlace(data.action, row, column, data.cellId);
  };

  return (
    <section className="settings-group">
      <h3>快捷面板布局</h3>
      <p className="settings-hint">
        底部面板是一个可滚动的二维按钮区域。拖动动作到格子里，也可以把已有按钮拖到其他格子；空格会保留。
      </p>

      <label className="settings-card-row action-panel-visible-row-control">
        <span className="settings-card-label">面板高度</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={actionPanel.visibleRows}
          onChange={(event) => onVisibleRowsChange(event.target.valueAsNumber)}
        />
        <span className="settings-card-suffix">行</span>
      </label>

      <div className="action-panel-layout-tools">
        <button type="button" onClick={() => onRowInsert(0)}>
          上方加行
        </button>
        <button type="button" onClick={() => onRowInsert(actionPanel.rows)}>
          下方加行
        </button>
        <button type="button" onClick={() => onColumnInsert(0)}>
          左侧加列
        </button>
        <button type="button" onClick={() => onColumnInsert(actionPanel.columns)}>
          右侧加列
        </button>
        <button type="button" onClick={() => onRowRemove(0)} disabled={actionPanel.rows <= 1}>
          删除上行
        </button>
        <button
          type="button"
          onClick={() => onRowRemove(actionPanel.rows - 1)}
          disabled={actionPanel.rows <= 1}
        >
          删除下行
        </button>
        <button
          type="button"
          onClick={() => onColumnRemove(0)}
          disabled={actionPanel.columns <= 1}
        >
          删除左列
        </button>
        <button
          type="button"
          onClick={() => onColumnRemove(actionPanel.columns - 1)}
          disabled={actionPanel.columns <= 1}
        >
          删除右列
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="action-panel-editor">
          <div className="action-panel-editor-grid-wrap">
            <div
              className="action-panel-editor-grid"
              style={
                {
                  '--action-panel-editor-columns': actionPanel.columns,
                  '--action-panel-editor-rows': actionPanel.rows,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: actionPanel.rows }).map((_, row) =>
                Array.from({ length: actionPanel.columns }).map((_, column) => {
                  const cell = cellByPosition.get(`${row}:${column}`);

                  return (
                    <EditablePanelCell
                      key={`${row}:${column}`}
                      cell={cell}
                      column={column}
                      row={row}
                      onRemove={onCellRemove}
                    />
                  );
                }),
              )}
            </div>
          </div>

          <div className="action-panel-library" aria-label="可放置动作">
            {ACTION_PANEL_ACTION_DEFINITIONS.map((definition) => (
              <ActionLibraryItem key={definition.action} definition={definition} />
            ))}
          </div>
        </div>
      </DndContext>

      <p className="settings-hint">
        删除行列会直接移除被删区域里的按钮。发送按钮不是必需的；如果不放发送按钮，也可以继续通过键盘回车发送。
      </p>
    </section>
  );
}

function EditablePanelCell({
  cell,
  column,
  row,
  onRemove,
}: {
  cell?: ActionPanelCell;
  column: number;
  row: number;
  onRemove: (cellId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `panel-cell:${row}:${column}` });
  const definition = cell ? ACTION_PANEL_ACTION_BY_KEY.get(cell.action) : undefined;

  return (
    <div
      ref={setNodeRef}
      className={[
        'action-panel-editor-cell',
        isOver ? 'action-panel-editor-cell--over' : '',
        definition ? 'action-panel-editor-cell--filled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {cell && definition ? (
        <PlacedActionButton cell={cell} definition={definition} onRemove={onRemove} />
      ) : (
        <span className="action-panel-empty-dot" aria-hidden="true" />
      )}
    </div>
  );
}

function PlacedActionButton({
  cell,
  definition,
  onRemove,
}: {
  cell: ActionPanelCell;
  definition: ActionPanelActionDefinition;
  onRemove: (cellId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed:${cell.id}`,
    data: { type: 'cell', cellId: cell.id, action: cell.action } satisfies DragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={`action-panel-placed-action ${isDragging ? 'action-panel-placed-action--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <button
        className="action-panel-placed-main"
        type="button"
        aria-label={`拖动 ${definition.settingsLabel}`}
        {...attributes}
        {...listeners}
      >
        {definition.icon}
        <span>{definition.settingsLabel}</span>
      </button>
      <button
        className="action-panel-remove-cell"
        type="button"
        aria-label={`移除 ${definition.settingsLabel}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onRemove(cell.id)}
      >
        ×
      </button>
    </div>
  );
}

function ActionLibraryItem({ definition }: { definition: ActionPanelActionDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library:${definition.action}`,
    data: { type: 'library', action: definition.action } satisfies DragData,
  });

  return (
    <button
      ref={setNodeRef}
      className={`action-panel-library-item ${isDragging ? 'action-panel-library-item--dragging' : ''}`}
      type="button"
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
    >
      {definition.icon}
      <span>{definition.settingsLabel}</span>
    </button>
  );
}
