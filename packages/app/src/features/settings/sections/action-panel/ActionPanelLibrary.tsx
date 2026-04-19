import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripIcon } from '../../../../shared/ui/icons';
import type { ActionPanelActionDefinition } from '../../../action-panel/actionPanelActions';
import { type DragData } from './actionPanelDrag';

interface ActionPanelLibraryProps {
  orderedDefinitions: ActionPanelActionDefinition[];
}

export function ActionPanelLibrary({ orderedDefinitions }: ActionPanelLibraryProps) {
  return (
    <>
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
    </>
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
