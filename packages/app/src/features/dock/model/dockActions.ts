import type { DockButtonKey } from '../../preferences/model/preferences';
import type { DockAction } from './useContinuousTrigger';

export type DockActionDefinition = {
  key: DockButtonKey;
  actionKey: DockAction;
  ariaLabel: string;
  settingsLabel: string;
  isContinuous: boolean;
};

export const DOCK_ACTION_DEFINITIONS: DockActionDefinition[] = [
  {
    key: 'enter',
    actionKey: 'enter',
    ariaLabel: '发送 Enter',
    settingsLabel: 'Enter',
    isContinuous: true,
  },
  {
    key: 'tab',
    actionKey: 'tab',
    ariaLabel: '发送 Tab',
    settingsLabel: 'Tab',
    isContinuous: true,
  },
  {
    key: 'shiftTab',
    actionKey: 'shift-tab',
    ariaLabel: '发送 Shift+Tab',
    settingsLabel: 'Shift+Tab',
    isContinuous: true,
  },
  {
    key: 'ctrlC',
    actionKey: 'ctrl-c',
    ariaLabel: '发送 Ctrl+C',
    settingsLabel: 'Ctrl+C',
    isContinuous: true,
  },
  {
    key: 'ctrlV',
    actionKey: 'ctrl-v',
    ariaLabel: '发送 Ctrl+V',
    settingsLabel: 'Ctrl+V',
    isContinuous: true,
  },
  {
    key: 'pasteNewline',
    actionKey: 'paste-newline',
    ariaLabel: '粘贴换行',
    settingsLabel: '粘贴换行',
    isContinuous: true,
  },
  {
    key: 'backspace',
    actionKey: 'backspace',
    ariaLabel: '发送 Backspace',
    settingsLabel: 'Backspace',
    isContinuous: true,
  },
];
