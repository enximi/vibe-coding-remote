import {
  BackspaceIcon,
  CtrlCIcon,
  CtrlVIcon,
  EnterIcon,
  PasteNewlineIcon,
  ShiftTabIcon,
  TabIcon,
} from '../../../ui/icons';
import type { Preferences } from '../../preferences/model/preferences';
import { DOCK_ACTION_DEFINITIONS } from '../model/dockActions';
import type { DockAction } from '../model/useContinuousTrigger';

export type DockActionConfig = {
  actionKey: DockAction;
  ariaLabel: string;
  icon: React.ReactNode;
  isContinuous: boolean;
  isVisible: boolean;
};

export function createDockActionConfigs({
  dockButtonOrder,
  dockButtons,
}: Pick<Preferences, 'dockButtonOrder' | 'dockButtons'>): DockActionConfig[] {
  const iconByKey: Record<keyof typeof dockButtons, React.ReactNode> = {
    enter: <EnterIcon width={20} height={20} />,
    tab: <TabIcon width={20} height={20} />,
    shiftTab: <ShiftTabIcon width={20} height={20} />,
    ctrlC: <CtrlCIcon width={20} height={20} />,
    ctrlV: <CtrlVIcon width={20} height={20} />,
    pasteNewline: <PasteNewlineIcon width={20} height={20} />,
    backspace: <BackspaceIcon width={20} height={20} />,
  };
  const definitionByKey = new Map(
    DOCK_ACTION_DEFINITIONS.map((definition) => [definition.key, definition]),
  );

  return dockButtonOrder
    .map((key) => {
      const definition = definitionByKey.get(key);
      if (!definition) {
        return null;
      }

      return {
        actionKey: definition.actionKey,
        ariaLabel: definition.ariaLabel,
        icon: iconByKey[key],
        isContinuous: definition.isContinuous,
        isVisible: dockButtons[key] !== false,
      };
    })
    .filter((button): button is DockActionConfig => button !== null);
}
