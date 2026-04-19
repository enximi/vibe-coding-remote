import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import {
  ACTION_PANEL_ACTION_BY_KEY,
  type ActionPanelActionDefinition,
} from '../../../action-panel/actionPanelActions';
import {
  clampActionPanelVisibleRows,
  type ActionPanelCell,
  type Preferences,
} from '../../../preferences/preferences';
import type { DragData } from './actionPanelDrag';

const PAN_ACTIVATION_DISTANCE_PX = 4;

interface ActionPanelEditorCanvasProps {
  actionPanel: Preferences['actionPanel'];
  actualVisibleRows: number;
  cellByPosition: Map<string, ActionPanelCell>;
  editorBounds: {
    columns: number;
    rows: number;
    startColumn: number;
    startRow: number;
  };
  hasConfiguredCells: boolean;
  isDraggingAction: boolean;
  onCellRemove: (cellId: string) => void;
  onVisibleRowsChange: (visibleRows: number) => void;
}

export function ActionPanelEditorCanvas({
  actionPanel,
  actualVisibleRows,
  cellByPosition,
  editorBounds,
  hasConfiguredCells,
  isDraggingAction,
  onCellRemove,
  onVisibleRowsChange,
}: ActionPanelEditorCanvasProps) {
  const [isPanningViewport, setIsPanningViewport] = useState(false);
  const [visibleRowsDraft, setVisibleRowsDraft] = useState(String(actionPanel.visibleRows));
  const panStateRef = useRef<{
    pointerId: number;
    scrollLeft: number;
    scrollTop: number;
    startX: number;
    startY: number;
  } | null>(null);
  const viewportRows = actionPanel.visibleRows + 1;

  useEffect(() => {
    setVisibleRowsDraft(String(actionPanel.visibleRows));
  }, [actionPanel.visibleRows]);

  const commitVisibleRowsDraft = () => {
    if (!visibleRowsDraft.trim()) {
      setVisibleRowsDraft(String(actionPanel.visibleRows));
      return;
    }

    const parsedValue = Number.parseInt(visibleRowsDraft, 10);
    const nextValue = clampActionPanelVisibleRows(
      Number.isFinite(parsedValue) ? parsedValue : actionPanel.visibleRows,
    );
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
    if (!isPanningViewport && Math.hypot(deltaX, deltaY) < PAN_ACTIVATION_DISTANCE_PX) {
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
    <>
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
            disabled={actionPanel.visibleRows <= 1}
            onClick={() => onVisibleRowsChange(actionPanel.visibleRows - 1)}
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
            onClick={() => onVisibleRowsChange(actionPanel.visibleRows + 1)}
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
                '--action-panel-editor-viewport-rows': viewportRows,
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
    </>
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
