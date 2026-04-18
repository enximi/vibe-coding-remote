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
import { useEffect, useMemo, useRef, useState } from 'react';
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

const ACTION_PANEL_EDITOR_CELL_SIZE = 84;
const ACTION_PANEL_EDITOR_GAP = 10;
const ACTION_PANEL_EDITOR_AXIS_SIZE = 28;
const DRAG_ACTIVATION_DELAY_MS = 220;
const EMPTY_CELL_LONG_PRESS_MS = 320;
const EMPTY_CELL_MOVE_THRESHOLD_PX = 10;

type DragData =
  | { type: 'library'; action: ActionPanelActionKey }
  | { type: 'cell'; action: ActionPanelActionKey; cellId: string };

type EmptyCellPickerState = {
  column: number;
  row: number;
};

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

function getEditorGridWidth(columns: number): number {
  return (
    columns * ACTION_PANEL_EDITOR_CELL_SIZE +
    Math.max(0, columns - 1) * ACTION_PANEL_EDITOR_GAP
  );
}

function getEditorGridHeight(rows: number): number {
  return rows * ACTION_PANEL_EDITOR_CELL_SIZE + Math.max(0, rows - 1) * ACTION_PANEL_EDITOR_GAP;
}

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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: DRAG_ACTIVATION_DELAY_MS, tolerance: 8 },
    }),
  );
  const { actionPanel } = prefs;
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [pickerState, setPickerState] = useState<EmptyCellPickerState | null>(null);
  const editorGridWidth = getEditorGridWidth(actionPanel.columns);
  const editorGridHeight = getEditorGridHeight(actionPanel.rows);
  const cellByPosition = useMemo(
    () => new Map(actionPanel.cells.map((cell) => [`${cell.row}:${cell.column}`, cell])),
    [actionPanel.cells],
  );
  const allSectionsCollapsed = isEditorCollapsed && isLibraryCollapsed;

  const closePicker = () => setPickerState(null);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    closePicker();
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

  const toggleAllSections = () => {
    if (allSectionsCollapsed) {
      setIsEditorCollapsed(false);
      setIsLibraryCollapsed(false);
      return;
    }

    setIsEditorCollapsed(true);
    setIsLibraryCollapsed(true);
    closePicker();
  };

  const handlePickerSelect = (action: ActionPanelActionKey) => {
    if (!pickerState) {
      return;
    }

    onCellPlace(action, pickerState.row, pickerState.column);
    closePicker();
  };

  return (
    <section className="settings-group">
      <h3>快捷面板布局</h3>
      <p className="settings-hint">
        底部面板是一个可滚动的二维按钮区域。轻点按钮会触发动作，长按已有按钮或待选按钮才进入拖动；空白格长按可直接选择要放进去的按钮。
      </p>

      <div className="settings-card-row action-panel-visible-row-control">
        <span className="settings-card-label">面板高度</span>
        <div className="action-panel-stepper" role="group" aria-label="调整面板高度">
          <button
            type="button"
            aria-label="减少面板高度"
            disabled={actionPanel.visibleRows <= 1}
            onClick={() => onVisibleRowsChange(actionPanel.visibleRows - 1)}
          >
            −
          </button>
          <span className="action-panel-stepper-value">{actionPanel.visibleRows} 行</span>
          <button
            type="button"
            aria-label="增加面板高度"
            onClick={() => onVisibleRowsChange(actionPanel.visibleRows + 1)}
          >
            +
          </button>
        </div>
      </div>

      <div className="action-panel-editor-overview">
        <div>
          <strong>编辑模式</strong>
          <p>滚动找位置，长按才开始拖动或添加。</p>
        </div>
        <button type="button" className="action-panel-panel-toggle" onClick={toggleAllSections}>
          {allSectionsCollapsed ? '展开全部' : '折叠全部'}
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="action-panel-editor">
          <section className="action-panel-editor-panel">
            <div className="action-panel-editor-panel-header">
              <div>
                <strong>网格编辑区</strong>
                <p>滑动可滚动，长按按钮才会进入拖拽。</p>
              </div>
              <button
                type="button"
                className="action-panel-panel-toggle"
                onClick={() => {
                  setIsEditorCollapsed((value) => !value);
                  closePicker();
                }}
              >
                {isEditorCollapsed ? '展开' : '收起'}
              </button>
            </div>

            {!isEditorCollapsed && (
              <div className="action-panel-editor-grid-wrap">
                <div className="action-panel-editor-layout">
                  <div className="action-panel-editor-corner" aria-hidden="true" />

                  <div
                    className="action-panel-editor-column-controls"
                    style={{ width: `${editorGridWidth + ACTION_PANEL_EDITOR_AXIS_SIZE}px` }}
                  >
                    <div className="action-panel-editor-column-axis">
                      {Array.from({ length: actionPanel.columns }).map((_, column) => (
                        <button
                          key={`remove-column:${column}`}
                          type="button"
                          className="action-panel-editor-axis-btn action-panel-editor-axis-btn--column action-panel-editor-axis-btn--danger"
                          aria-label={`删除第 ${column + 1} 列`}
                          disabled={actionPanel.columns <= 1}
                          onClick={() => {
                            closePicker();
                            onColumnRemove(column);
                          }}
                          style={{
                            left: `${column * (ACTION_PANEL_EDITOR_CELL_SIZE + ACTION_PANEL_EDITOR_GAP) + ACTION_PANEL_EDITOR_CELL_SIZE / 2}px`,
                          }}
                        >
                          ×
                        </button>
                      ))}

                      {Array.from({ length: actionPanel.columns + 1 }).map((_, index) => (
                        <button
                          key={`insert-column:${index}`}
                          type="button"
                          className="action-panel-editor-axis-btn action-panel-editor-axis-btn--column action-panel-editor-axis-btn--insert"
                          aria-label={
                            index === 0
                              ? '在最左侧插入一列'
                              : index === actionPanel.columns
                                ? '在最右侧插入一列'
                                : `在第 ${index} 列右侧插入一列`
                          }
                          onClick={() => {
                            closePicker();
                            onColumnInsert(index);
                          }}
                          style={{
                            left: `${index === 0 ? 0 : index * ACTION_PANEL_EDITOR_CELL_SIZE + (index - 1) * ACTION_PANEL_EDITOR_GAP}px`,
                          }}
                        >
                          +
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="action-panel-editor-row-controls"
                    style={{ height: `${editorGridHeight + ACTION_PANEL_EDITOR_AXIS_SIZE}px` }}
                  >
                    <div className="action-panel-editor-row-axis">
                      {Array.from({ length: actionPanel.rows }).map((_, row) => (
                        <button
                          key={`remove-row:${row}`}
                          type="button"
                          className="action-panel-editor-axis-btn action-panel-editor-axis-btn--row action-panel-editor-axis-btn--danger"
                          aria-label={`删除第 ${row + 1} 行`}
                          disabled={actionPanel.rows <= 1}
                          onClick={() => {
                            closePicker();
                            onRowRemove(row);
                          }}
                          style={{
                            top: `${row * (ACTION_PANEL_EDITOR_CELL_SIZE + ACTION_PANEL_EDITOR_GAP) + ACTION_PANEL_EDITOR_CELL_SIZE / 2}px`,
                          }}
                        >
                          ×
                        </button>
                      ))}

                      {Array.from({ length: actionPanel.rows + 1 }).map((_, index) => (
                        <button
                          key={`insert-row:${index}`}
                          type="button"
                          className="action-panel-editor-axis-btn action-panel-editor-axis-btn--row action-panel-editor-axis-btn--insert"
                          aria-label={
                            index === 0
                              ? '在最上方插入一行'
                              : index === actionPanel.rows
                                ? '在最下方插入一行'
                                : `在第 ${index} 行下方插入一行`
                          }
                          onClick={() => {
                            closePicker();
                            onRowInsert(index);
                          }}
                          style={{
                            top: `${index === 0 ? 0 : index * ACTION_PANEL_EDITOR_CELL_SIZE + (index - 1) * ACTION_PANEL_EDITOR_GAP}px`,
                          }}
                        >
                          +
                        </button>
                      ))}
                    </div>
                  </div>

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
                            onLongPressEmpty={() => setPickerState({ row, column })}
                            onRemove={onCellRemove}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="action-panel-editor-panel">
            <div className="action-panel-editor-panel-header">
              <div>
                <strong>待选动作</strong>
                <p>滑动浏览，长按动作卡片才会开始拖动。</p>
              </div>
              <button
                type="button"
                className="action-panel-panel-toggle"
                onClick={() => setIsLibraryCollapsed((value) => !value)}
              >
                {isLibraryCollapsed ? '展开' : '收起'}
              </button>
            </div>

            {!isLibraryCollapsed && (
              <div className="action-panel-library" aria-label="可放置动作">
                {ACTION_PANEL_ACTION_DEFINITIONS.map((definition) => (
                  <ActionLibraryItem key={definition.action} definition={definition} />
                ))}
              </div>
            )}
          </section>

          {pickerState && (
            <section className="action-panel-picker-card">
              <div className="action-panel-picker-header">
                <div>
                  <strong>
                    在第 {pickerState.row + 1} 行第 {pickerState.column + 1} 列添加按钮
                  </strong>
                  <p>轻点要放入该空格的动作。</p>
                </div>
                <button
                  type="button"
                  className="action-panel-panel-toggle"
                  onClick={closePicker}
                >
                  关闭
                </button>
              </div>

              <div className="action-panel-picker-options">
                {ACTION_PANEL_ACTION_DEFINITIONS.map((definition) => (
                  <button
                    key={`picker:${definition.action}`}
                    type="button"
                    className="action-panel-picker-option"
                    onClick={() => handlePickerSelect(definition.action)}
                  >
                    {definition.icon}
                    <span>{definition.settingsLabel}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
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
  onLongPressEmpty,
  onRemove,
}: {
  cell?: ActionPanelCell;
  column: number;
  row: number;
  onLongPressEmpty: () => void;
  onRemove: (cellId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `panel-cell:${row}:${column}` });
  const definition = cell ? ACTION_PANEL_ACTION_BY_KEY.get(cell.action) : undefined;
  const timeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const firedLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearLongPress = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pressStartRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (definition || !event.isPrimary) {
      return;
    }

    firedLongPressRef.current = false;
    pressStartRef.current = { x: event.clientX, y: event.clientY };
    timeoutRef.current = window.setTimeout(() => {
      firedLongPressRef.current = true;
      onLongPressEmpty();
    }, EMPTY_CELL_LONG_PRESS_MS);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (definition || !pressStartRef.current || firedLongPressRef.current) {
      return;
    }

    const offsetX = event.clientX - pressStartRef.current.x;
    const offsetY = event.clientY - pressStartRef.current.y;
    if (Math.hypot(offsetX, offsetY) < EMPTY_CELL_MOVE_THRESHOLD_PX) {
      return;
    }

    clearLongPress();
  };

  const handlePointerEnd = () => {
    clearLongPress();
  };

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onContextMenu={(event) => event.preventDefault()}
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
        aria-label={`长按拖动 ${definition.settingsLabel}`}
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
      aria-label={`长按拖动 ${definition.settingsLabel}`}
      {...attributes}
      {...listeners}
    >
      {definition.icon}
      <span>{definition.settingsLabel}</span>
    </button>
  );
}
