import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';
import {
  BackspaceIcon,
  CtrlCIcon,
  CtrlVIcon,
  EnterIcon,
  GripIcon,
  PasteNewlineIcon,
  ShiftTabIcon,
  TabIcon,
} from '../../../../ui/icons';
import { DOCK_ACTION_DEFINITIONS } from '../../../dock/model/dockActions';
import {
  type DockButtonKey,
  type DockButtons,
  normalizeDockButtonOrder,
  type Preferences,
} from '../../../preferences/model/preferences';
import type { SetPreferences } from '../../../preferences/model/usePreferencesStore';

interface DockSettingsSectionProps {
  prefs: Preferences;
  setPrefs: SetPreferences;
  visibleDockActionCount: number | null;
}

export function DockSettingsSection({
  prefs,
  setPrefs,
  visibleDockActionCount,
}: DockSettingsSectionProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const dockActionDefinitions = useMemo(
    () => new Map(DOCK_ACTION_DEFINITIONS.map((definition) => [definition.key, definition])),
    [],
  );

  const iconByKey: Record<DockButtonKey, React.ReactNode> = useMemo(
    () => ({
      enter: <EnterIcon width={18} height={18} />,
      tab: <TabIcon width={18} height={18} />,
      shiftTab: <ShiftTabIcon width={18} height={18} />,
      ctrlC: <CtrlCIcon width={18} height={18} />,
      ctrlV: <CtrlVIcon width={18} height={18} />,
      pasteNewline: <PasteNewlineIcon width={18} height={18} />,
      backspace: <BackspaceIcon width={18} height={18} />,
    }),
    [],
  );

  const orderedDockButtons = normalizeDockButtonOrder(prefs.dockButtonOrder);
  const enabledDockButtons = orderedDockButtons.filter((key) => prefs.dockButtons[key]);
  const pinnedDockButtonCount = visibleDockActionCount ?? enabledDockButtons.length;
  const pinnedDockButtons = new Set(enabledDockButtons.slice(0, pinnedDockButtonCount));

  const toggleDockButton = (key: keyof DockButtons) => {
    setPrefs((prev) => ({
      ...prev,
      dockButtons: {
        ...prev.dockButtons,
        [key]: !prev.dockButtons[key],
      },
    }));
  };

  const handleDockOrderDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setPrefs((prev) => {
      const currentOrder = normalizeDockButtonOrder(prev.dockButtonOrder);
      const oldIndex = currentOrder.indexOf(active.id as DockButtonKey);
      const newIndex = currentOrder.indexOf(over.id as DockButtonKey);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return {
        ...prev,
        dockButtonOrder: arrayMove(currentOrder, oldIndex, newIndex),
      };
    });
  };

  return (
    <section className="settings-group">
      <h3>快捷动作显示与顺序</h3>
      <p className="settings-hint">
        拖动手柄调整顺序，点击条目切换启用状态。应用会根据当前页面宽度尽量显示更多按钮，显示不下的自动收进“更多”。
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDockOrderDragEnd}
      >
        <SortableContext items={orderedDockButtons} strategy={verticalListSortingStrategy}>
          <div className="dock-order-list">
            {orderedDockButtons.map((key) => {
              const definition = dockActionDefinitions.get(key);
              if (!definition) {
                return null;
              }

              return (
                <SortableDockButtonItem
                  key={key}
                  buttonKey={key}
                  icon={iconByKey[key]}
                  label={definition.settingsLabel}
                  active={prefs.dockButtons[key]}
                  location={
                    prefs.dockButtons[key]
                      ? pinnedDockButtons.has(key)
                        ? 'dock'
                        : 'overflow'
                      : 'hidden'
                  }
                  onToggle={() => toggleDockButton(key)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableDockButtonItem({
  buttonKey,
  icon,
  label,
  active,
  location,
  onToggle,
}: {
  buttonKey: DockButtonKey;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  location: 'dock' | 'overflow' | 'hidden';
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: buttonKey });

  return (
    <div
      ref={setNodeRef}
      className={`dock-order-item ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="dock-order-handle"
        aria-label={`拖动调整 ${label} 的顺序`}
        {...attributes}
        {...listeners}
      >
        <GripIcon width={18} height={18} />
      </button>

      <button className="dock-order-content" type="button" onClick={onToggle}>
        <div className="dock-order-icon-wrapper">{icon}</div>
        <div className="dock-order-text">
          <span className="dock-order-title">{label}</span>
          <span className="dock-order-subtitle">
            {location === 'dock'
              ? '显示在 Dock'
              : location === 'overflow'
                ? '收起在“更多”'
                : '已隐藏'}
          </span>
        </div>
      </button>

      <div className="dock-order-actions">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          className="settings-switch"
          onClick={onToggle}
          aria-label={`启用 ${label}`}
        >
          <span className="settings-switch-thumb" />
        </button>
      </div>
    </div>
  );
}
