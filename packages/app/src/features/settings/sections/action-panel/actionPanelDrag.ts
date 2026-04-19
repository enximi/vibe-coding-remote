import type { ActionPanelActionKey } from '../../../preferences/preferences';

export const DRAG_ACTIVATION_DELAY_MS = 220;

export type DragData =
  | { type: 'library'; action: ActionPanelActionKey }
  | { type: 'cell'; action: ActionPanelActionKey; cellId: string };

export function reorderLibraryOrder(
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
