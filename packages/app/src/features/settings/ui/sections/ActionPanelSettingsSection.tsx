import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
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
import { GripIcon } from '../../../../ui/icons';
import type {
  ActionPanelActionKey,
  ActionPanelCell,
  Preferences,
} from '../../../preferences/model/preferences';
import {
  getActionPanelDisplayBounds,
  getActionPanelEditorBounds,
} from '../../../preferences/model/preferences';

const DRAG_ACTIVATION_DELAY_MS = 220;
const PAN_ACTIVATION_DISTANCE_PX = 4;

type DragData =
  | { type: 'library'; action: ActionPanelActionKey }
  | { type: 'cell'; action: ActionPanelActionKey; cellId: string };

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
    })
  );

  const { actionPanel } = prefs;
  const [isDraggingAction, setIsDraggingAction] = useState(false);
  const [isPanningViewport, setIsPanningViewport] = useState(false);
  const panStateRef = useRef<{
    pointerId: number;
    scrollLeft: number;
    scrollTop: number;
    startX: number;
    startY: number;
  } | null>(null);
  const displayBounds = useMemo(
    () => getActionPanelDisplayBounds(actionPanel.cells),
    [actionPanel.cells],
  );
  const editorBounds = useMemo(
    () => getActionPanelEditorBounds(actionPanel.cells),
    [actionPanel.cells],
  );
  const hasConfiguredCells = actionPanel.cells.length > 0;
  const visibleRows = actionPanel.visibleRows;
  const actualVisibleRows = hasConfiguredCells
    ? Math.min(actionPanel.visibleRows, displayBounds.rows)
    : 0;
  const [visibleRowsDraft, setVisibleRowsDraft] = useState(String(actionPanel.visibleRows));
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

  useEffect(() => {
    setVisibleRowsDraft(String(actionPanel.visibleRows));
  }, [actionPanel.visibleRows]);

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

  const viewportRows = visibleRows + 1;

  const commitVisibleRowsDraft = () => {
    if (!visibleRowsDraft.trim()) {
      setVisibleRowsDraft(String(actionPanel.visibleRows));
      return;
    }

    const parsedValue = Number.parseInt(visibleRowsDraft, 10);
    const nextValue = Math.max(1, Number.isFinite(parsedValue) ? parsedValue : actionPanel.visibleRows);
    onVisibleRowsChange(nextValue);
    setVisibleRowsDraft(String(nextValue));
  };

  const stopViewportPan = () => {
    panStateRef.current = null;
    setIsPanningViewport(false);
  };

  const handleViewportPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingAction || event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;
    if (
      target.closest('.action-panel-placed-action') ||
      target.closest('.action-panel-remove-cell') ||
      target.closest('.action-panel-stepper')
    ) {
      return;
    }

    panStateRef.current = {
      pointerId: event.pointerId,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleViewportPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const panState = panStateRef.current;
    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - panState.startX;
    const deltaY = event.clientY - panState.startY;
    if (
      !isPanningViewport &&
      Math.hypot(deltaX, deltaY) < PAN_ACTIVATION_DISTANCE_PX
    ) {
      return;
    }

    setIsPanningViewport(true);
    event.preventDefault();
    event.currentTarget.scrollLeft = panState.scrollLeft - deltaX;
    event.currentTarget.scrollTop = panState.scrollTop - deltaY;
  };

  const handleViewportPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    stopViewportPan();
  };

  return (
    <section className="settings-group">
      <h3>快捷面板布局</h3>
      <p className="settings-hint">
        这里控制的是主界面底部快捷面板的最大显示高度，以及按钮在面板里的排布方式。空面板时会先显示一个空槽；只要放入按钮，编辑网格就会在四周补出可继续扩展的空槽。
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={() => {
          setIsDraggingAction(true);
          stopViewportPan();
        }}
        onDragCancel={() => setIsDraggingAction(false)}
        onDragEnd={handleDragEnd}
      >
        <div className="action-panel-editor">
          <section
            className="action-panel-editor-panel"
            style={
              {
                '--action-panel-editor-viewport-rows': viewportRows,
              } as React.CSSProperties
            }
          >
            <div className="action-panel-editor-panel-header">
              <div>
                <strong>面板排布</strong>
                <p>
                  {hasConfiguredCells
                    ? '从下方把动作拖进网格即可添加，拖到已有动作上会直接互换位置。四周都留了一圈空槽，方便继续往上、下、左、右扩展。主界面最终会按实际有内容的行数自动收紧显示高度。'
                    : '从下方把动作拖进这个空槽即可添加第一个按钮。放进去之后，编辑网格才会在四周补出空槽，方便继续往上、下、左、右扩展。'}
                </p>
              </div>
            </div>

            <div className="action-panel-visible-rows-control">
              <span className="action-panel-visible-rows-label">快捷面板最大高度</span>
              <div className="settings-stepper" role="group" aria-label="快捷面板最大显示高度">
                <button
                  type="button"
                  className="settings-stepper-btn"
                  aria-label="减少快捷面板最大显示高度"
                  disabled={visibleRows <= 1}
                  onClick={() => onVisibleRowsChange(visibleRows - 1)}
                >
                  −
                </button>
                <label className="settings-stepper-value" aria-label="输入快捷面板最大显示高度">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={visibleRowsDraft}
                    onChange={(event) => setVisibleRowsDraft(event.target.value)}
                    onBlur={commitVisibleRowsDraft}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') {
                        return;
                      }

                      event.currentTarget.blur();
                    }}
                    aria-label="输入快捷面板最大显示高度"
                  />
                  <span>行</span>
                </label>
                <button
                  type="button"
                  className="settings-stepper-btn"
                  aria-label="增加快捷面板最大显示高度"
                  onClick={() => onVisibleRowsChange(visibleRows + 1)}
                >
                  +
                </button>
              </div>
              <p className="action-panel-visible-rows-note">
                当前主界面实际会显示 {actualVisibleRows} 行。
              </p>
            </div>

            <div className="action-panel-editor-canvas">
              <div
                className={[
                  'action-panel-editor-grid-wrap',
                  isPanningViewport ? 'action-panel-editor-grid-wrap--panning' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onPointerDown={handleViewportPointerDown}
                onPointerMove={handleViewportPointerMove}
                onPointerUp={handleViewportPointerEnd}
                onPointerCancel={handleViewportPointerEnd}
                onPointerLeave={handleViewportPointerEnd}
              >
                <div
                  className="action-panel-editor-grid"
                  style={
                    {
                      '--action-panel-editor-columns': editorBounds.columns,
                      '--action-panel-editor-rows': editorBounds.rows,
                    } as React.CSSProperties
                  }
                >
                  {Array.from({ length: editorBounds.rows }).map((_, rowIndex) =>
                    Array.from({ length: editorBounds.columns }).map((_, columnIndex) => {
                      const row = editorBounds.startRow + rowIndex;
                      const column = editorBounds.startColumn + columnIndex;
                      const cell = cellByPosition.get(`${row}:${column}`);
                      const isExpansionSlot =
                        rowIndex === 0 ||
                        columnIndex === 0 ||
                        rowIndex === editorBounds.rows - 1 ||
                        columnIndex === editorBounds.columns - 1;

                      return (
                        <EditablePanelCell
                          key={`${rowIndex}:${columnIndex}`}
                          cell={cell}
                          column={column}
                          isDraggingAction={isDraggingAction}
                          isExpansionSlot={isExpansionSlot}
                          row={row}
                          onRemove={onCellRemove}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
            </div>

            <div className="action-panel-editor-panel-header action-panel-editor-panel-header--library">
              <div>
                <strong>可选动作</strong>
                <p>拖到上面的网格里即可加入快捷面板。在这里调整顺序后，下次添加时也会按这个顺序展示。</p>
              </div>
            </div>

            <div className="action-panel-library-viewport" aria-label="可选动作">
              <div className="action-panel-library">
                {orderedDefinitions.map((definition) => (
                  <ActionLibraryItem key={definition.action} definition={definition} />
                ))}
              </div>
            </div>
          </section>

        </div>
      </DndContext>
    </section>
  );
}

function EditablePanelCell({
  cell,
  column,
  isDraggingAction,
  isExpansionSlot,
  row,
  onRemove,
}: {
  cell?: ActionPanelCell;
  column: number;
  isDraggingAction: boolean;
  isExpansionSlot: boolean;
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
        !definition ? 'action-panel-editor-cell--empty' : '',
        isDraggingAction ? 'action-panel-editor-cell--dragging' : '',
        isExpansionSlot ? 'action-panel-editor-cell--edge' : '',
        isOver ? 'action-panel-editor-cell--over' : '',
        definition ? 'action-panel-editor-cell--filled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onContextMenu={(event) => event.preventDefault()}
    >
      {cell && definition ? (
        <PlacedActionButton cell={cell} definition={definition} onRemove={onRemove} />
      ) : (
        <span className="action-panel-empty-slot-hint" aria-hidden="true">
          +
        </span>
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
        draggable={false}
        aria-label={`长按拖动 ${definition.settingsLabel}`}
        onContextMenu={(event) => event.preventDefault()}
        {...attributes}
        {...listeners}
      >
        <span className="action-panel-placed-icon" aria-hidden="true">
          {definition.icon}
        </span>
        <span className="action-panel-placed-label">{definition.settingsLabel}</span>
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
  const { isOver, setNodeRef: setDropNodeRef } = useDroppable({
    id: `library-item:${definition.action}`,
  });

  return (
    <button
      ref={(node) => {
        setNodeRef(node);
        setDropNodeRef(node);
      }}
      className={[
        'action-panel-library-item',
        isDragging ? 'action-panel-library-item--dragging' : '',
        isOver && !isDragging ? 'action-panel-library-item--over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      type="button"
      draggable={false}
      style={{ transform: CSS.Translate.toString(transform) }}
      aria-label={`长按拖动 ${definition.settingsLabel}，可调整顺序或拖入网格`}
      onContextMenu={(event) => event.preventDefault()}
      {...attributes}
      {...listeners}
    >
      <span className="action-panel-library-item-icon" aria-hidden="true">
        {definition.icon}
      </span>
      <span className="action-panel-library-item-label">{definition.settingsLabel}</span>
      <GripIcon className="action-panel-library-item-grip" width={15} height={15} aria-hidden="true" />
    </button>
  );
}

function reorderLibraryOrder(
  libraryOrder: ActionPanelActionKey[],
  activeAction: ActionPanelActionKey,
  overAction: ActionPanelActionKey,
): ActionPanelActionKey[] {
  const nextOrder = [...libraryOrder];
  const activeIndex = nextOrder.indexOf(activeAction);
  const overIndex = nextOrder.indexOf(overAction);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return nextOrder;
  }

  const [moved] = nextOrder.splice(activeIndex, 1);
  nextOrder.splice(overIndex, 0, moved);
  return nextOrder;
}
